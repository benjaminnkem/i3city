import { createHmac, randomUUID } from "node:crypto";
import { BadGatewayException, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type {
  AdminOrder,
  CreateOrderResult,
  LoginResult,
  PaymentLink,
  PublicOrder,
  PublicSettings,
} from "@repo/types";
import bcrypt from "bcryptjs";
import request from "supertest";
import type { App } from "supertest/types.js";
import { AppModule } from "../src/app.module.js";
import { configureApp } from "../src/app.setup.js";
import { EmailService, type EmailMessage } from "../src/email/email.service.js";
import { PaymentsService } from "../src/payments/payments.service.js";
import { verifyPaystackSignature } from "../src/payments/paystack-signature.js";
import {
  PaystackService,
  type InitializeInput,
  type PaystackTransaction,
} from "../src/payments/paystack.service.js";
import { PrismaService } from "../src/prisma/prisma.service.js";
import { StorageService } from "../src/storage/storage.service.js";

interface Envelope<T> {
  success: true;
  data: T;
}

const SECRET = "sk_test_e2e_secret";

describe("Paystack payments (e2e)", () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let payments: PaymentsService;
  let token: string;
  let productId: string;
  let originalEnabled = false;
  let originalSupportEmail: string | null = null;
  const tag = `e2e-${randomUUID().slice(0, 8)}`;
  const email = `admin-${tag}@test.local`;
  const sent: EmailMessage[] = [];
  const initialized: InitializeInput[] = [];
  const transactions = new Map<string, PaystackTransaction>();
  let failInitialize = false;

  const paystack = {
    configured: true,
    verifySignature: (raw: Buffer | undefined, signature: string | undefined) =>
      verifyPaystackSignature(SECRET, raw, signature),
    initialize: (input: InitializeInput) => {
      if (failInitialize) {
        return Promise.reject(new BadGatewayException("provider down"));
      }
      initialized.push(input);
      return Promise.resolve({
        authorizationUrl: `https://checkout.paystack.test/${input.reference}`,
      });
    },
    verify: (reference: string): Promise<PaystackTransaction> =>
      Promise.resolve(
        transactions.get(reference) ?? {
          status: "abandoned",
          reference,
          amount: 0,
          currency: "NGN",
        },
      ),
  };
  const mailer = {
    send: (message: EmailMessage) => {
      sent.push(message);
      return Promise.resolve();
    },
  };
  const storage = {
    publicUrl: (key: string) => `https://cdn.test/${key}`,
    deleteObjects: () => Promise.resolve(),
  };

  const auth = () => ({ Authorization: `Bearer ${token}` });
  const http = () => request(app.getHttpServer());
  const stock = async () =>
    (await prisma.product.findUniqueOrThrow({ where: { id: productId } }))
      .stock;
  const wait = () => new Promise((resolve) => setTimeout(resolve, 80));
  const success = (reference: string, total: number): PaystackTransaction => ({
    status: "success",
    reference,
    amount: total * 100,
    currency: "NGN",
  });
  const signed = (payload: object, key = SECRET) => {
    const raw = JSON.stringify(payload);
    return {
      raw,
      signature: createHmac("sha512", key).update(raw).digest("hex"),
    };
  };
  const postWebhook = (payload: object, signature?: string) => {
    const { raw, signature: valid } = signed(payload);
    return http()
      .post("/api/payments/paystack/webhook")
      .set("Content-Type", "application/json")
      .set("x-paystack-signature", signature ?? valid)
      .send(raw);
  };
  const order = (
    method: "PAYSTACK" | "WHATSAPP",
    overrides: Record<string, unknown> = {},
  ) =>
    http()
      .post("/api/orders")
      .send({
        customerName: `${tag} Buyer`,
        phone: "08012345678",
        email: "buyer@example.com",
        address: "12 Allen Avenue",
        city: "Ikeja",
        state: "Oyo",
        paymentMethod: method,
        items: [{ productId, quantity: 2 }],
        ...overrides,
      });
  const created = async (method: "PAYSTACK" | "WHATSAPP", overrides = {}) =>
    (await order(method, overrides).expect(201))
      .body as Envelope<CreateOrderResult>;
  const row = (code: string) =>
    prisma.order.findUniqueOrThrow({
      where: { code },
      include: { events: true },
    });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PaystackService)
      .useValue(paystack)
      .overrideProvider(EmailService)
      .useValue(mailer)
      .overrideProvider(StorageService)
      .useValue(storage)
      .compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    payments = app.get(PaymentsService);
    await prisma.adminUser.create({
      data: { email, passwordHash: await bcrypt.hash("password-123", 4) },
    });
    const login = await http()
      .post("/api/auth/login")
      .send({ email, password: "password-123" })
      .expect(200);
    token = (login.body as Envelope<LoginResult>).data.accessToken;
    const settings = await prisma.storeSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, whatsappNumber: "2348031112222" },
    });
    originalEnabled = settings.paystackEnabled;
    originalSupportEmail = settings.supportEmail;
    await prisma.storeSettings.update({
      where: { id: 1 },
      data: { paystackEnabled: true, supportEmail: `owner-${tag}@test.local` },
    });
    productId = (
      await prisma.product.create({
        data: {
          name: `${tag} Gadget`,
          slug: `${tag}-gadget`,
          price: 20_000,
          stock: 50,
        },
      })
    ).id;
  });

  afterAll(async () => {
    await prisma.order.deleteMany({
      where: { customerName: { startsWith: tag } },
    });
    await prisma.product.deleteMany({ where: { name: { startsWith: tag } } });
    await prisma.adminUser.deleteMany({ where: { email } });
    await prisma.storeSettings.update({
      where: { id: 1 },
      data: {
        paystackEnabled: originalEnabled,
        supportEmail: originalSupportEmail,
      },
    });
    await app.close();
  });

  beforeEach(() => {
    sent.length = 0;
    initialized.length = 0;
    failInitialize = false;
  });

  it("offers card payment publicly only when it is switched on", async () => {
    const on = await http().get("/api/settings/public").expect(200);
    expect((on.body as Envelope<PublicSettings>).data.paymentMethods).toEqual([
      "WHATSAPP",
      "PAYSTACK",
    ]);
    await prisma.storeSettings.update({
      where: { id: 1 },
      data: { paystackEnabled: false },
    });
    const off = await http().get("/api/settings/public").expect(200);
    expect((off.body as Envelope<PublicSettings>).data.paymentMethods).toEqual([
      "WHATSAPP",
    ]);
    await order("PAYSTACK").expect(422);
    await prisma.storeSettings.update({
      where: { id: 1 },
      data: { paystackEnabled: true },
    });
  });

  describe("checkout with card", () => {
    it("needs an email address", async () => {
      await order("PAYSTACK", { email: "" }).expect(422);
    });

    it("holds stock, starts a payment for the exact total and stays quiet until paid", async () => {
      const before = await stock();
      const { data } = await created("PAYSTACK");
      expect(data.whatsappUrl).toBeNull();
      expect(data.authorizationUrl).toBe(
        `https://checkout.paystack.test/${data.order.code}`,
      );
      expect(data.order.status).toBe("PENDING_PAYMENT");
      expect(data.order.canPayOnline).toBe(true);
      const minutes =
        (new Date(data.order.paymentExpiresAt ?? 0).getTime() - Date.now()) /
        60_000;
      expect(minutes).toBeGreaterThan(28);
      expect(minutes).toBeLessThanOrEqual(30);
      expect(await stock()).toBe(before - 2);
      expect(initialized[0]).toMatchObject({
        reference: data.order.code,
        amountKobo: data.order.total * 100,
        email: "buyer@example.com",
      });
      expect(initialized[0]?.callbackUrl).toContain(
        `/order/${data.order.code}`,
      );
      await wait();
      expect(sent).toHaveLength(0);
    });

    it("cancels the order and gives the stock back when the provider is down", async () => {
      const before = await stock();
      failInitialize = true;
      await order("PAYSTACK", { customerName: `${tag} Unlucky` }).expect(503);
      const cancelled = await prisma.order.findFirstOrThrow({
        where: { customerName: `${tag} Unlucky` },
      });
      expect(cancelled.status).toBe("CANCELLED");
      expect(await stock()).toBe(before);
    });
  });

  describe("confirming a payment", () => {
    it("marks the order paid and confirmed once, however many times it is checked", async () => {
      const { data } = await created("PAYSTACK");
      const code = data.order.code;
      transactions.set(code, success(code, data.order.total));
      const verified = await http()
        .get(`/api/orders/${code}/verify`)
        .query({ reference: code })
        .expect(200);
      const publicOrder = (verified.body as Envelope<PublicOrder>).data;
      expect(publicOrder).toMatchObject({
        paymentStatus: "PAID",
        status: "CONFIRMED",
        canPayOnline: false,
      });
      await wait();
      expect(sent.map((message) => message.to).sort()).toEqual(
        [`owner-${tag}@test.local`, "buyer@example.com"].sort(),
      );
      await http().get(`/api/orders/${code}/verify`).expect(200);
      await postWebhook({
        event: "charge.success",
        data: { reference: code },
      }).expect(200);
      await wait();
      expect(sent).toHaveLength(2);
      const saved = await row(code);
      expect(saved.paidAt).not.toBeNull();
      expect(
        saved.events.filter((event) => event.status === "CONFIRMED"),
      ).toHaveLength(1);
    });

    it("does not double up when the webhook and the callback arrive together", async () => {
      const { data } = await created("PAYSTACK");
      const code = data.order.code;
      transactions.set(code, success(code, data.order.total));
      await Promise.all([
        postWebhook({ event: "charge.success", data: { reference: code } }),
        http().get(`/api/orders/${code}/verify`),
        http().get(`/api/orders/${code}/verify`),
        postWebhook({ event: "charge.success", data: { reference: code } }),
      ]);
      await wait();
      expect(sent).toHaveLength(2);
      const saved = await row(code);
      expect(saved.paymentStatus).toBe("PAID");
      expect(
        saved.events.filter((event) => event.status === "CONFIRMED"),
      ).toHaveLength(1);
    });

    it("refuses a payment whose amount or currency does not match", async () => {
      const { data } = await created("PAYSTACK");
      const code = data.order.code;
      transactions.set(code, {
        ...success(code, data.order.total),
        amount: data.order.total * 100 - 100,
      });
      let verified = await http().get(`/api/orders/${code}/verify`).expect(200);
      expect((verified.body as Envelope<PublicOrder>).data.paymentStatus).toBe(
        "UNPAID",
      );
      transactions.set(code, {
        ...success(code, data.order.total),
        currency: "USD",
      });
      verified = await http().get(`/api/orders/${code}/verify`).expect(200);
      expect((verified.body as Envelope<PublicOrder>).data.paymentStatus).toBe(
        "UNPAID",
      );
      await wait();
      expect(sent).toHaveLength(0);
    });

    it("records a failed payment and lets the customer try again with a new reference", async () => {
      const { data } = await created("PAYSTACK");
      const code = data.order.code;
      transactions.set(code, {
        status: "failed",
        reference: code,
        amount: 0,
        currency: "NGN",
      });
      const verified = await http()
        .get(`/api/orders/${code}/verify`)
        .expect(200);
      const failed = (verified.body as Envelope<PublicOrder>).data;
      expect(failed.paymentStatus).toBe("FAILED");
      expect(failed.canPayOnline).toBe(true);
      const retry = await http()
        .post(`/api/orders/${code}/pay`)
        .send({})
        .expect(200);
      expect((retry.body as Envelope<PaymentLink>).data.authorizationUrl).toBe(
        `https://checkout.paystack.test/${code}-2`,
      );
      expect((await row(code)).paymentStatus).toBe("UNPAID");
    });
  });

  describe("webhook security", () => {
    it("rejects bad signatures and unsigned requests", async () => {
      const payload = {
        event: "charge.success",
        data: { reference: "I3-AAAAAA" },
      };
      await postWebhook(payload, "abcd").expect(401);
      await postWebhook(
        payload,
        signed(payload, "sk_test_wrong").signature,
      ).expect(401);
      await http()
        .post("/api/payments/paystack/webhook")
        .set("Content-Type", "application/json")
        .send(JSON.stringify(payload))
        .expect(401);
    });

    it("acknowledges events it does not act on", async () => {
      await postWebhook({
        event: "transfer.success",
        data: { reference: "x" },
      }).expect(200);
      await postWebhook({
        event: "charge.success",
        data: { reference: "I3-AAAAAA" },
      }).expect(200);
      await postWebhook({
        event: "charge.success",
        data: { reference: "not-a-reference" },
      }).expect(200);
    });
  });

  describe("paying for a WhatsApp order", () => {
    it("adds a card option to an unpaid order and confirms it once paid", async () => {
      const { data } = await created("WHATSAPP", { email: "" });
      const code = data.order.code;
      expect(data.order.canPayOnline).toBe(true);
      await http().post(`/api/orders/${code}/pay`).send({}).expect(422);
      const pay = await http()
        .post(`/api/orders/${code}/pay`)
        .send({ email: "late@example.com" })
        .expect(200);
      expect(
        (pay.body as Envelope<PaymentLink>).data.authorizationUrl,
      ).toContain(code);
      expect((await row(code)).email).toBe("late@example.com");
      transactions.set(code, success(code, data.order.total));
      await postWebhook({
        event: "charge.success",
        data: { reference: code },
      }).expect(200);
      const saved = await row(code);
      expect(saved).toMatchObject({
        paymentStatus: "PAID",
        status: "CONFIRMED",
      });
      await http().post(`/api/orders/${code}/pay`).send({}).expect(422);
    });

    it("keeps a status the owner has already moved on", async () => {
      const { data } = await created("WHATSAPP");
      const code = data.order.code;
      const id = (await row(code)).id;
      await http()
        .patch(`/api/admin/orders/${id}`)
        .set(auth())
        .send({ status: "CONFIRMED" })
        .expect(200);
      await http()
        .patch(`/api/admin/orders/${id}`)
        .set(auth())
        .send({ status: "PACKED" })
        .expect(200);
      await http().post(`/api/orders/${code}/pay`).send({}).expect(200);
      transactions.set(code, success(code, data.order.total));
      await http()
        .get(`/api/orders/${code}/verify`)
        .query({ reference: code })
        .expect(200);
      expect(await row(code)).toMatchObject({
        paymentStatus: "PAID",
        status: "PACKED",
      });
    });

    it("only checks references that belong to the order", async () => {
      const { data } = await created("PAYSTACK");
      const other = await created("PAYSTACK");
      transactions.set(
        other.data.order.code,
        success(other.data.order.code, other.data.order.total),
      );
      await http()
        .get(`/api/orders/${data.order.code}/verify`)
        .query({ reference: other.data.order.code })
        .expect(200);
      expect((await row(data.order.code)).paymentStatus).toBe("UNPAID");
      expect((await row(other.data.order.code)).paymentStatus).toBe("UNPAID");
    });
  });

  describe("expiring unpaid orders", () => {
    it("cancels overdue card orders and releases their stock, but leaves the rest", async () => {
      const before = await stock();
      const overdue = await created("PAYSTACK", {
        customerName: `${tag} Overdue`,
      });
      const fresh = await created("PAYSTACK", { customerName: `${tag} Fresh` });
      const paid = await created("PAYSTACK", {
        customerName: `${tag} Paid In Time`,
      });
      expect(await stock()).toBe(before - 6);
      const past = new Date(Date.now() - 60_000);
      await prisma.order.updateMany({
        where: {
          code: { in: [overdue.data.order.code, paid.data.order.code] },
        },
        data: { expiresAt: past },
      });
      transactions.set(
        paid.data.order.code,
        success(paid.data.order.code, paid.data.order.total),
      );
      const cancelled = await payments.expireOverdue();
      expect(cancelled).toBeGreaterThanOrEqual(1);
      expect((await row(overdue.data.order.code)).status).toBe("CANCELLED");
      expect((await row(fresh.data.order.code)).status).toBe("PENDING_PAYMENT");
      expect(await row(paid.data.order.code)).toMatchObject({
        status: "CONFIRMED",
        paymentStatus: "PAID",
      });
      expect(await stock()).toBe(before - 4);
      const tracking = await http()
        .get(`/api/orders/${overdue.data.order.code}`)
        .expect(200);
      expect((tracking.body as Envelope<PublicOrder>).data).toMatchObject({
        status: "CANCELLED",
        canPayOnline: false,
      });
      await http()
        .post(`/api/orders/${overdue.data.order.code}/pay`)
        .send({})
        .expect(422);
    });

    it("tells the owner when money arrives for an order that was already cancelled", async () => {
      const { data } = await created("PAYSTACK", {
        customerName: `${tag} Late Payer`,
      });
      const code = data.order.code;
      await prisma.order.update({
        where: { code },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      expect(await payments.expireOverdue()).toBeGreaterThanOrEqual(1);
      sent.length = 0;
      transactions.set(code, success(code, data.order.total));
      await postWebhook({
        event: "charge.success",
        data: { reference: code },
      }).expect(200);
      await wait();
      expect(await row(code)).toMatchObject({
        status: "CANCELLED",
        paymentStatus: "PAID",
      });
      expect(sent).toHaveLength(1);
      expect(sent[0]?.to).toBe(`owner-${tag}@test.local`);
      expect(sent[0]?.subject).toContain("cancelled order");
      const detail = await http()
        .get(`/api/admin/orders/${(await row(code)).id}`)
        .set(auth())
        .expect(200);
      expect((detail.body as Envelope<AdminOrder>).data).toMatchObject({
        paystackRef: code,
        paymentMethod: "PAYSTACK",
      });
    });
  });
});
