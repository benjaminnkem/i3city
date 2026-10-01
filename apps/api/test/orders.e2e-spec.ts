import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type {
  AdminOrder,
  AdminSettings,
  CreateOrderResult,
  LoginResult,
  PublicCategory,
  PublicOrder,
  PublicProduct,
  PublicProductDetail,
  PublicSettings,
  ShippingRateInfo,
  ValidatedCartLine,
} from "@repo/types";
import bcrypt from "bcryptjs";
import request from "supertest";
import type { App } from "supertest/types.js";
import { AppModule } from "../src/app.module.js";
import { configureApp } from "../src/app.setup.js";
import { EmailService, type EmailMessage } from "../src/email/email.service.js";
import { PrismaService } from "../src/prisma/prisma.service.js";
import { StorageService } from "../src/storage/storage.service.js";

interface Envelope<T> {
  success: true;
  data: T;
  meta?: { total: number };
}

describe("Storefront and orders (e2e)", () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;
  let originalSettings: AdminSettings;
  let originalRates: ShippingRateInfo[];
  const tag = `e2e-${randomUUID().slice(0, 8)}`;
  const email = `admin-${tag}@test.local`;
  const sent: EmailMessage[] = [];
  const storage = {
    publicUrl: (key: string) => `https://cdn.test/${key}`,
    deleteObjects: () => Promise.resolve(),
  };
  const mailer = {
    send: (message: EmailMessage) => {
      sent.push(message);
      return Promise.resolve();
    },
  };
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const http = () => request(app.getHttpServer());
  let phoneProduct: { id: string; slug: string };
  let cableProduct: { id: string };
  let hiddenProduct: { id: string };
  let categorySlug: string;

  const customer = (overrides: Record<string, unknown> = {}) => ({
    customerName: `${tag} Ada Obi`,
    phone: "0801 234 5678",
    email: "ada@example.com",
    address: "12 Allen Avenue",
    city: "Ikeja",
    state: "Lagos",
    paymentMethod: "WHATSAPP",
    ...overrides,
  });
  const stockOf = async (id: string) =>
    (await prisma.product.findUniqueOrThrow({ where: { id } })).stock;
  const placeOrder = (
    items: { productId: string; quantity: number }[],
    overrides = {},
  ) =>
    http()
      .post("/api/orders")
      .send({ ...customer(overrides), items });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(StorageService)
      .useValue(storage)
      .overrideProvider(EmailService)
      .useValue(mailer)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.adminUser.create({
      data: { email, passwordHash: await bcrypt.hash("password-123", 4) },
    });
    const login = await http()
      .post("/api/auth/login")
      .send({ email, password: "password-123" })
      .expect(200);
    token = (login.body as Envelope<LoginResult>).data.accessToken;
    originalSettings = (
      (await http().get("/api/admin/settings").set(auth()).expect(200))
        .body as Envelope<AdminSettings>
    ).data;
    originalRates = (
      (await http().get("/api/admin/shipping-rates").set(auth()).expect(200))
        .body as Envelope<ShippingRateInfo[]>
    ).data;
    const category = await prisma.category.create({
      data: { name: `${tag} Phones`, slug: `${tag}-phones`, sortOrder: 999 },
    });
    categorySlug = category.slug;
    phoneProduct = await prisma.product.create({
      data: {
        name: `${tag} Phone`,
        slug: `${tag}-phone`,
        price: 50_000,
        compareAtPrice: 60_000,
        stock: 5,
        brand: "Nova",
        categoryId: category.id,
        images: [`products/${randomUUID()}.webp`],
        featured: true,
      },
    });
    cableProduct = await prisma.product.create({
      data: {
        name: `${tag} Cable`,
        slug: `${tag}-cable`,
        price: 3_000,
        stock: 10,
        categoryId: category.id,
      },
    });
    hiddenProduct = await prisma.product.create({
      data: {
        name: `${tag} Hidden`,
        slug: `${tag}-hidden`,
        price: 1_000,
        stock: 5,
        active: false,
      },
    });
  });

  afterAll(async () => {
    await prisma.order.deleteMany({
      where: { customerName: { startsWith: tag } },
    });
    await prisma.product.deleteMany({ where: { name: { startsWith: tag } } });
    await prisma.category.deleteMany({ where: { name: { startsWith: tag } } });
    await prisma.adminUser.deleteMany({ where: { email } });
    await prisma.storeSettings.update({
      where: { id: 1 },
      data: {
        storeName: originalSettings.storeName,
        whatsappNumber: originalSettings.whatsappNumber,
        supportEmail: originalSettings.supportEmail,
        address: originalSettings.address,
        openingHours: originalSettings.openingHours,
        bankDetails: originalSettings.bankDetails,
        defaultShippingFee: originalSettings.defaultShippingFee,
        freeShippingOver: originalSettings.freeShippingOver,
      },
    });
    for (const rate of originalRates) {
      await prisma.shippingRate.update({
        where: { state: rate.state },
        data: { fee: rate.fee, etaDays: rate.etaDays },
      });
    }
    await app.close();
  });

  describe("admin settings and shipping", () => {
    it("validates and normalises the WhatsApp number", async () => {
      const base = {
        storeName: "i3City",
        defaultShippingFee: 5000,
        freeShippingOver: 100_000,
        supportEmail: `owner-${tag}@test.local`,
        address: "Egbeda, Ibadan",
        openingHours: "Mon to Sat, 9am to 7pm",
        bankDetails: "Bank X, 0123456789",
      };
      await http()
        .put("/api/admin/settings")
        .set(auth())
        .send({ ...base, whatsappNumber: "12345" })
        .expect(400);
      const response = await http()
        .put("/api/admin/settings")
        .set(auth())
        .send({ ...base, whatsappNumber: "0803 111 2222" })
        .expect(200);
      expect(
        (response.body as Envelope<AdminSettings>).data.whatsappNumber,
      ).toBe("2348031112222");
    });

    it("updates shipping rates and rejects unknown states", async () => {
      await http()
        .put("/api/admin/shipping-rates")
        .set(auth())
        .send({ rates: [{ state: "Atlantis", fee: 1 }] })
        .expect(400);
      const response = await http()
        .put("/api/admin/shipping-rates")
        .set(auth())
        .send({
          rates: [
            { state: "Lagos", fee: 3500, etaDays: "1 to 2 days" },
            { state: "Kano", fee: 8000, etaDays: "" },
          ],
        })
        .expect(200);
      const rates = (response.body as Envelope<ShippingRateInfo[]>).data;
      expect(rates.find((rate) => rate.state === "Kano")).toMatchObject({
        fee: 8000,
        etaDays: null,
      });
    });

    it("requires a token", async () => {
      await http().get("/api/admin/settings").expect(401);
      await http().get("/api/admin/orders").expect(401);
    });
  });

  describe("public catalog", () => {
    it("serves public settings with shipping rates", async () => {
      const response = await http().get("/api/settings/public").expect(200);
      const settings = (response.body as Envelope<PublicSettings>).data;
      expect(settings.paymentMethods).toEqual(["WHATSAPP"]);
      expect(settings.whatsappNumber).toBe("2348031112222");
      expect(
        settings.shippingRates.find((rate) => rate.state === "Lagos")?.fee,
      ).toBe(3500);
    });

    it("lists only categories that have visible products", async () => {
      const response = await http().get("/api/categories").expect(200);
      const categories = (response.body as Envelope<PublicCategory[]>).data;
      expect(
        categories.find((category) => category.slug === categorySlug)
          ?.productCount,
      ).toBe(2);
    });

    it("filters, searches, sorts and hides inactive products", async () => {
      const list = async (query: Record<string, string>) =>
        (
          (await http().get("/api/products").query(query).expect(200))
            .body as Envelope<PublicProduct[]>
        ).data.map((product) => product.name);
      expect(await list({ search: tag })).not.toContain(`${tag} Hidden`);
      expect(await list({ category: categorySlug, sort: "price-asc" })).toEqual(
        [`${tag} Cable`, `${tag} Phone`],
      );
      expect(
        await list({ category: categorySlug, sort: "price-desc" }),
      ).toEqual([`${tag} Phone`, `${tag} Cable`]);
      expect(await list({ category: categorySlug, minPrice: "10000" })).toEqual(
        [`${tag} Phone`],
      );
      expect(await list({ category: categorySlug, maxPrice: "10000" })).toEqual(
        [`${tag} Cable`],
      );
      expect(await list({ search: tag, featured: "true" })).toEqual([
        `${tag} Phone`,
      ]);
      await http().get("/api/products").query({ limit: "500" }).expect(400);
    });

    it("returns product detail with related products and image urls", async () => {
      const response = await http()
        .get(`/api/products/${tag}-phone`)
        .expect(200);
      const detail = (response.body as Envelope<PublicProductDetail>).data;
      expect(detail.imageUrls[0]).toContain("https://cdn.test/products/");
      expect(detail.related.map((item) => item.name)).toEqual([`${tag} Cable`]);
      await http().get(`/api/products/${tag}-hidden`).expect(404);
      await http().get("/api/products/does-not-exist").expect(404);
    });

    it("validates cart lines against current stock, price and availability", async () => {
      const response = await http()
        .post("/api/cart/validate")
        .send({
          items: [
            { productId: phoneProduct.id, quantity: 9, price: 45_000 },
            { productId: hiddenProduct.id, quantity: 1 },
            { productId: "missing", quantity: 1 },
          ],
        })
        .expect(200);
      const [phone, hidden, missing] = (
        response.body as Envelope<ValidatedCartLine[]>
      ).data;
      expect(phone).toMatchObject({
        quantity: 5,
        quantityAdjusted: true,
        priceChanged: true,
        price: 50_000,
      });
      expect(hidden).toMatchObject({ unavailable: true, quantity: 0 });
      expect(missing).toMatchObject({ unavailable: true });
    });
  });

  describe("placing orders", () => {
    it("creates an order, takes stock, prices it on the server and returns a WhatsApp link", async () => {
      sent.length = 0;
      const before = await stockOf(phoneProduct.id);
      const response = await placeOrder([
        { productId: phoneProduct.id, quantity: 1 },
        { productId: phoneProduct.id, quantity: 1 },
        { productId: cableProduct.id, quantity: 2 },
      ]).expect(201);
      const { order, whatsappUrl } = (
        response.body as Envelope<CreateOrderResult>
      ).data;
      expect(order.code).toMatch(/^I3-[A-Z2-9]{6}$/);
      expect(order.status).toBe("AWAITING_CONFIRMATION");
      expect(order.subtotal).toBe(106_000);
      expect(order.shippingFee).toBe(0);
      expect(order.total).toBe(106_000);
      expect(order.items).toHaveLength(2);
      expect(await stockOf(phoneProduct.id)).toBe(before - 2);
      expect(whatsappUrl.startsWith("https://wa.me/2348031112222?text=")).toBe(
        true,
      );
      expect(decodeURIComponent(whatsappUrl)).toContain(order.code);
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(sent.map((message) => message.to).sort()).toEqual(
        [`owner-${tag}@test.local`, "ada@example.com"].sort(),
      );
      expect(sent[0]?.subject).toContain(order.code);
    });

    it("charges the state shipping fee below the free shipping threshold", async () => {
      const response = await placeOrder(
        [{ productId: cableProduct.id, quantity: 1 }],
        { state: "Kano" },
      ).expect(201);
      const { order } = (response.body as Envelope<CreateOrderResult>).data;
      expect(order.shippingFee).toBe(8000);
      expect(order.total).toBe(11_000);
    });

    it("refuses more than the stock and leaves every stock level untouched", async () => {
      const phoneBefore = await stockOf(phoneProduct.id);
      const cableBefore = await stockOf(cableProduct.id);
      const response = await placeOrder([
        { productId: cableProduct.id, quantity: 1 },
        { productId: phoneProduct.id, quantity: phoneBefore + 1 },
      ]).expect(409);
      expect(response.body).toMatchObject({
        success: false,
        error: { code: "CONFLICT" },
      });
      expect(await stockOf(phoneProduct.id)).toBe(phoneBefore);
      expect(await stockOf(cableProduct.id)).toBe(cableBefore);
    });

    it("rejects hidden products, bad phones, empty carts, unknown states and card payments", async () => {
      await placeOrder([{ productId: hiddenProduct.id, quantity: 1 }]).expect(
        422,
      );
      await placeOrder([{ productId: cableProduct.id, quantity: 1 }], {
        phone: "12345",
      }).expect(400);
      await placeOrder([]).expect(400);
      await placeOrder([{ productId: cableProduct.id, quantity: 1 }], {
        state: "Atlantis",
      }).expect(400);
      await placeOrder([{ productId: cableProduct.id, quantity: 1 }], {
        paymentMethod: "PAYSTACK",
      }).expect(422);
    });

    it("shows a public tracking view without personal details", async () => {
      const created = await placeOrder([
        { productId: cableProduct.id, quantity: 1 },
      ]).expect(201);
      const code = (created.body as Envelope<CreateOrderResult>).data.order
        .code;
      const response = await http()
        .get(`/api/orders/${code.toLowerCase()}`)
        .expect(200);
      const order = (response.body as Envelope<PublicOrder>).data;
      expect(order.code).toBe(code);
      expect(order.timeline).toHaveLength(1);
      const serialised = JSON.stringify(response.body);
      expect(serialised).not.toContain("0801");
      expect(serialised).not.toContain("2348012345678");
      expect(serialised).not.toContain("Allen Avenue");
      expect(serialised).not.toContain("ada@example.com");
      await http().get("/api/orders/I3-AAAAAA").expect(404);
      await http().get("/api/orders/nonsense").expect(404);
    });
  });

  describe("managing orders", () => {
    let orderId: string;
    let code: string;

    beforeAll(async () => {
      const created = await placeOrder(
        [{ productId: phoneProduct.id, quantity: 2 }],
        {
          customerName: `${tag} Managed Buyer`,
        },
      ).expect(201);
      code = (created.body as Envelope<CreateOrderResult>).data.order.code;
      const list = await http()
        .get("/api/admin/orders")
        .query({ search: code })
        .set(auth())
        .expect(200);
      orderId = (list.body as Envelope<{ id: string }[]>).data[0]?.id ?? "";
    });

    it("lists with filters and finds by code, name and phone", async () => {
      const find = async (query: Record<string, string>) =>
        (
          (
            await http()
              .get("/api/admin/orders")
              .query(query)
              .set(auth())
              .expect(200)
          ).body as Envelope<{ code: string }[]>
        ).data.map((order) => order.code);
      expect(await find({ search: code })).toEqual([code]);
      expect(await find({ search: "Managed Buyer" })).toContain(code);
      expect(
        await find({
          search: "0801 234 5678",
          status: "AWAITING_CONFIRMATION",
        }),
      ).toContain(code);
      expect(await find({ search: code, status: "DELIVERED" })).toEqual([]);
    });

    it("returns the full order for the owner", async () => {
      const response = await http()
        .get(`/api/admin/orders/${orderId}`)
        .set(auth())
        .expect(200);
      const order = (response.body as Envelope<AdminOrder>).data;
      expect(order).toMatchObject({
        phone: "2348012345678",
        address: "12 Allen Avenue",
        city: "Ikeja",
      });
      expect(order.items[0]).toMatchObject({ quantity: 2 });
      await http().get("/api/admin/orders/missing").set(auth()).expect(404);
    });

    it("marks an order paid and records the time", async () => {
      const response = await http()
        .patch(`/api/admin/orders/${orderId}`)
        .set(auth())
        .send({ paymentStatus: "PAID" })
        .expect(200);
      const order = (response.body as Envelope<AdminOrder>).data;
      expect(order.paymentStatus).toBe("PAID");
      expect(order.paidAt).not.toBeNull();
    });

    it("moves through the allowed steps, sends the shipped email and builds a timeline", async () => {
      const move = (status: string, extra: Record<string, unknown> = {}) =>
        http()
          .patch(`/api/admin/orders/${orderId}`)
          .set(auth())
          .send({ status, ...extra });
      await move("DELIVERED").expect(422);
      await move("CONFIRMED").expect(200);
      await move("PACKED").expect(200);
      sent.length = 0;
      const shipped = await move("SHIPPED", {
        courier: "GIG Logistics",
        trackingNumber: "GIG-123",
      }).expect(200);
      expect((shipped.body as Envelope<AdminOrder>).data).toMatchObject({
        courier: "GIG Logistics",
        trackingNumber: "GIG-123",
      });
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(sent).toHaveLength(1);
      expect(sent[0]?.to).toBe("ada@example.com");
      expect(sent[0]?.text).toContain("GIG-123");
      const delivered = await move("DELIVERED").expect(200);
      expect(
        (delivered.body as Envelope<AdminOrder>).data.timeline.map(
          (entry) => entry.status,
        ),
      ).toEqual([
        "AWAITING_CONFIRMATION",
        "CONFIRMED",
        "PACKED",
        "SHIPPED",
        "DELIVERED",
      ]);
      await move("CANCELLED").expect(422);
      const tracking = await http().get(`/api/orders/${code}`).expect(200);
      expect((tracking.body as Envelope<PublicOrder>).data).toMatchObject({
        status: "DELIVERED",
        courier: "GIG Logistics",
        trackingNumber: "GIG-123",
      });
    });

    it("restocks the items when an order is cancelled", async () => {
      const before = await stockOf(cableProduct.id);
      const created = await placeOrder(
        [{ productId: cableProduct.id, quantity: 3 }],
        {
          customerName: `${tag} Cancel Buyer`,
        },
      ).expect(201);
      const newCode = (created.body as Envelope<CreateOrderResult>).data.order
        .code;
      expect(await stockOf(cableProduct.id)).toBe(before - 3);
      const row = await prisma.order.findUniqueOrThrow({
        where: { code: newCode },
      });
      await http()
        .patch(`/api/admin/orders/${row.id}`)
        .set(auth())
        .send({ status: "CANCELLED" })
        .expect(200);
      expect(await stockOf(cableProduct.id)).toBe(before);
      await http()
        .patch(`/api/admin/orders/${row.id}`)
        .set(auth())
        .send({ status: "CONFIRMED" })
        .expect(422);
      expect(await stockOf(cableProduct.id)).toBe(before);
    });
  });
});
