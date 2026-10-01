import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { ImportResult, LoginResult } from "@repo/types";
import bcrypt from "bcryptjs";
import request from "supertest";
import type { App } from "supertest/types.js";
import { AppModule } from "../src/app.module.js";
import { configureApp } from "../src/app.setup.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

interface Envelope<T> {
  success: true;
  data: T;
}

describe("Product CSV (e2e)", () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;
  const tag = `e2e-${randomUUID().slice(0, 8)}`;
  const email = `admin-${tag}@test.local`;
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const http = () => request(app.getHttpServer());
  const importRows = (rows: Record<string, string>[], dryRun: boolean) =>
    http()
      .post("/api/admin/products/import")
      .set(auth())
      .send({ rows, dryRun });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
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
    await prisma.product.create({
      data: {
        name: `${tag} Existing`,
        slug: `${tag}-existing`,
        sku: `${tag}-OLD`,
        price: 5000,
        stock: 3,
        description: 'Has a "quote", a comma, and\na line break',
      },
    });
  });

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { name: { startsWith: tag } } });
    await prisma.category.deleteMany({ where: { name: { startsWith: tag } } });
    await prisma.adminUser.deleteMany({ where: { email } });
    await app.close();
  });

  it("exports products as a CSV download", async () => {
    await app.listen(0);
    const response = await fetch(
      `${await app.getUrl()}/api/admin/products/export`,
      {
        headers: auth(),
      },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain("products-");
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    const text = new TextDecoder().decode(bytes.slice(3));
    expect(
      text.startsWith(
        "sku,name,brand,category,price,compare_at_price,stock,active,featured,description",
      ),
    ).toBe(true);
    expect(text).toContain(`${tag}-OLD,${tag} Existing`);
    expect(text).toContain('"Has a ""quote"", a comma, and\na line break"');
  });

  it("previews an import without saving", async () => {
    const response = await importRows(
      [
        {
          name: `${tag} New`,
          sku: `${tag}-NEW`,
          price: "₦12,500",
          stock: "4",
          category: `${tag} Gadgets`,
        },
        {
          name: `${tag} Existing`,
          sku: `${tag}-OLD`,
          price: "6000",
          stock: "9",
        },
        { name: `${tag} Broken`, sku: `${tag}-BAD`, price: "free" },
        { name: `${tag} Twin`, sku: `${tag}-NEW`, price: "100" },
        { name: `${tag} Discount`, price: "1000", compare_at_price: "900" },
      ],
      true,
    ).expect(200);
    const result = (response.body as Envelope<ImportResult>).data;
    expect(result.dryRun).toBe(true);
    expect(result.summary).toEqual({ create: 1, update: 1, error: 3 });
    expect(result.createdCategories).toEqual([`${tag} Gadgets`]);
    expect(result.rows.map((row) => [row.line, row.action])).toEqual([
      [2, "create"],
      [3, "update"],
      [4, "error"],
      [5, "error"],
      [6, "error"],
    ]);
    expect(await prisma.product.count({ where: { sku: `${tag}-NEW` } })).toBe(
      0,
    );
    expect(
      await prisma.category.count({ where: { name: `${tag} Gadgets` } }),
    ).toBe(0);
  });

  it("applies valid rows, updates by SKU and creates categories", async () => {
    const response = await importRows(
      [
        {
          name: `${tag} New`,
          sku: `${tag}-NEW`,
          price: "12500",
          stock: "4",
          category: `${tag} Gadgets`,
          featured: "yes",
        },
        {
          name: `${tag} Existing`,
          sku: `${tag}-OLD`,
          price: "6000",
          stock: "9",
        },
        { name: `${tag} Broken`, price: "free" },
      ],
      false,
    ).expect(200);
    const result = (response.body as Envelope<ImportResult>).data;
    expect(result.summary).toEqual({ create: 1, update: 1, error: 1 });
    const created = await prisma.product.findUnique({
      where: { sku: `${tag}-NEW` },
      include: { category: true },
    });
    expect(created).toMatchObject({
      price: 12500,
      stock: 4,
      featured: true,
      active: true,
    });
    expect(created?.category?.name).toBe(`${tag} Gadgets`);
    const updated = await prisma.product.findUnique({
      where: { sku: `${tag}-OLD` },
    });
    expect(updated).toMatchObject({ price: 6000, stock: 9 });
    expect(updated?.description).toContain("quote");
    expect(
      await prisma.product.count({ where: { name: `${tag} Broken` } }),
    ).toBe(0);
  });

  it("rejects files over the row limit", async () => {
    const rows = Array.from({ length: 1001 }, (_, index) => ({
      name: `row ${index}`,
      price: "100",
    }));
    await importRows(rows, true).expect(400);
  });
});
