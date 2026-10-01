import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { AdminStats, LoginResult } from "@repo/types";
import bcrypt from "bcryptjs";
import request from "supertest";
import type { App } from "supertest/types.js";
import { AppModule } from "../src/app.module.js";
import { configureApp } from "../src/app.setup.js";
import { PrismaService } from "../src/prisma/prisma.service.js";
import { StorageService } from "../src/storage/storage.service.js";

interface Envelope<T> {
  success: true;
  data: T;
}

const DAY_MS = 86_400_000;

describe("Stats and bulk delete (e2e)", () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;
  const tag = `e2e-${randomUUID().slice(0, 8)}`;
  const email = `admin-${tag}@test.local`;
  const deleted: string[] = [];
  const storage = {
    publicUrl: (key: string) => `https://cdn.test/${key}`,
    deleteObjects: (keys: string[]) => {
      deleted.push(...keys);
      return Promise.resolve();
    },
  };

  const auth = () => ({ Authorization: `Bearer ${token}` });
  const http = () => request(app.getHttpServer());
  const fetchStats = async () =>
    (
      (await http().get("/api/admin/stats").set(auth()).expect(200))
        .body as Envelope<AdminStats>
    ).data;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(StorageService)
      .useValue(storage)
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
  });

  afterAll(async () => {
    await prisma.order.deleteMany({
      where: { customerName: { startsWith: tag } },
    });
    await prisma.product.deleteMany({ where: { name: { startsWith: tag } } });
    await prisma.adminUser.deleteMany({ where: { email } });
    await app.close();
  });

  it("requires an access token", async () => {
    await http().get("/api/admin/stats").expect(401);
  });

  it("reports revenue, orders, products and low stock", async () => {
    const before = await fetchStats();
    const product = await prisma.product.create({
      data: {
        name: `${tag} Charger`,
        slug: `${tag}-charger`,
        price: 10_000,
        stock: 2,
        images: [`products/${randomUUID()}.webp`],
      },
    });
    const makeOrder = (
      suffix: string,
      daysAgo: number,
      total: number,
      overrides: {
        paid: boolean;
        status: "AWAITING_CONFIRMATION" | "DELIVERED";
      },
    ) =>
      prisma.order.create({
        data: {
          code: `T-${randomUUID().slice(0, 8)}`,
          customerName: `${tag} ${suffix}`,
          phone: "08000000000",
          address: "1 Test Street",
          city: "Ibadan",
          state: "Oyo",
          subtotal: total,
          shippingFee: 0,
          total,
          paymentMethod: "WHATSAPP",
          paymentStatus: overrides.paid ? "PAID" : "UNPAID",
          status: overrides.status,
          paidAt: overrides.paid
            ? new Date(Date.now() - daysAgo * DAY_MS)
            : null,
          createdAt: new Date(Date.now() - daysAgo * DAY_MS),
          items: {
            create: [
              {
                productId: product.id,
                name: `${tag} Charger`,
                price: 10_000,
                quantity: total / 10_000,
              },
            ],
          },
        },
      });
    await makeOrder("recent", 1, 20_000, { paid: true, status: "DELIVERED" });
    await makeOrder("older", 15, 10_000, { paid: true, status: "DELIVERED" });
    await makeOrder("open", 0, 10_000, {
      paid: false,
      status: "AWAITING_CONFIRMATION",
    });

    const after = await fetchStats();
    expect(after.orders.revenue7d - before.orders.revenue7d).toBe(20_000);
    expect(after.orders.revenue30d - before.orders.revenue30d).toBe(30_000);
    expect(after.orders.paidCount30d - before.orders.paidCount30d).toBe(2);
    expect(after.orders.awaitingAction - before.orders.awaitingAction).toBe(1);
    expect(after.orders.today - before.orders.today).toBeGreaterThanOrEqual(1);
    expect(after.revenueSeries).toHaveLength(30);
    expect(after.revenueSeries.at(-1)?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(after.products.total - before.products.total).toBe(1);
    expect(after.products.lowStock - before.products.lowStock).toBe(1);
    expect(after.products.inventoryValue - before.products.inventoryValue).toBe(
      20_000,
    );
    const top = after.topProducts.find(
      (entry) => entry.name === `${tag} Charger`,
    );
    expect(top).toMatchObject({ units: 3, revenue: 30_000 });
    const lowStock = after.lowStock.find((item) => item.id === product.id);
    expect(lowStock?.imageUrl).toContain("https://cdn.test/products/");
  });

  it("deletes several products and their images", async () => {
    const keyA = `products/${randomUUID()}.webp`;
    const keyB = `products/${randomUUID()}.webp`;
    const [a, b] = await Promise.all([
      prisma.product.create({
        data: {
          name: `${tag} Bulk A`,
          slug: `${tag}-bulk-a`,
          price: 1000,
          images: [keyA],
        },
      }),
      prisma.product.create({
        data: {
          name: `${tag} Bulk B`,
          slug: `${tag}-bulk-b`,
          price: 1000,
          images: [keyB],
        },
      }),
    ]);
    const response = await http()
      .post("/api/admin/products/delete")
      .set(auth())
      .send({ ids: [a.id, b.id, "missing"] })
      .expect(200);
    expect((response.body as Envelope<{ deleted: number }>).data.deleted).toBe(
      2,
    );
    expect(deleted).toEqual(expect.arrayContaining([keyA, keyB]));
    await http().get(`/api/admin/products/${a.id}`).set(auth()).expect(404);
    await http()
      .post("/api/admin/products/delete")
      .set(auth())
      .send({ ids: [] })
      .expect(400);
  });
});
