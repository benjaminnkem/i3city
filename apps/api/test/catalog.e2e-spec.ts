import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type {
  AdminCategory,
  AdminProduct,
  LoginResult,
  UploadedImage,
} from "@repo/types";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import request from "supertest";
import type { App } from "supertest/types.js";
import { AppModule } from "../src/app.module.js";
import { configureApp } from "../src/app.setup.js";
import { PrismaService } from "../src/prisma/prisma.service.js";
import { StorageService } from "../src/storage/storage.service.js";

interface Envelope<T> {
  success: true;
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

const imageKey = () => `products/${randomUUID()}.webp`;

describe("Catalog (e2e)", () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;
  const tag = `e2e-${randomUUID().slice(0, 8)}`;
  const email = `admin-${tag}@test.local`;
  const deleted: string[] = [];
  const stored: { key: string; size: number; contentType: string }[] = [];

  const storage = {
    publicUrl: (key: string) => `https://cdn.test/${key}`,
    putObject: (key: string, body: Buffer, contentType: string) => {
      stored.push({ key, size: body.length, contentType });
      return Promise.resolve();
    },
    deleteObjects: (keys: string[]) => {
      deleted.push(...keys);
      return Promise.resolve();
    },
  };

  const auth = () => ({ Authorization: `Bearer ${token}` });
  const http = () => request(app.getHttpServer());

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
    await prisma.product.deleteMany({ where: { name: { startsWith: tag } } });
    await prisma.category.deleteMany({ where: { name: { startsWith: tag } } });
    await prisma.adminUser.deleteMany({ where: { email } });
    await app.close();
  });

  it("requires an access token", async () => {
    await http().get("/api/admin/categories").expect(401);
    await http().get("/api/admin/products").expect(401);
    await http().post("/api/admin/uploads").expect(401);
  });

  describe("categories", () => {
    let first: AdminCategory;
    let second: AdminCategory;

    it("creates categories with unique slugs and increasing order", async () => {
      const a = await http()
        .post("/api/admin/categories")
        .set(auth())
        .send({ name: `${tag} Alpha` })
        .expect(201);
      const b = await http()
        .post("/api/admin/categories")
        .set(auth())
        .send({ name: `${tag} Alpha` })
        .expect(201);
      first = (a.body as Envelope<AdminCategory>).data;
      second = (b.body as Envelope<AdminCategory>).data;
      expect(first.slug).toBe(`${tag}-alpha`);
      expect(second.slug).toBe(`${tag}-alpha-2`);
      expect(second.sortOrder).toBeGreaterThan(first.sortOrder);
    });

    it("renames and rejects a duplicate slug", async () => {
      const renamed = await http()
        .patch(`/api/admin/categories/${second.id}`)
        .set(auth())
        .send({ name: `${tag} Beta`, slug: `${tag}-beta` })
        .expect(200);
      expect((renamed.body as Envelope<AdminCategory>).data.name).toBe(
        `${tag} Beta`,
      );
      const conflict = await http()
        .patch(`/api/admin/categories/${second.id}`)
        .set(auth())
        .send({ slug: first.slug })
        .expect(409);
      expect(conflict.body).toMatchObject({
        error: { code: "CONFLICT" },
      });
      await http()
        .patch("/api/admin/categories/missing")
        .set(auth())
        .send({ name: "x" })
        .expect(404);
    });

    it("reorders only with a complete id list", async () => {
      await http()
        .put("/api/admin/categories/order")
        .set(auth())
        .send({ ids: [first.id] })
        .expect(400);
      const all = await http().get("/api/admin/categories").set(auth());
      const ids = (all.body as Envelope<AdminCategory[]>).data.map(
        (category) => category.id,
      );
      const reversed = [...ids].reverse();
      const response = await http()
        .put("/api/admin/categories/order")
        .set(auth())
        .send({ ids: reversed })
        .expect(200);
      expect(
        (response.body as Envelope<AdminCategory[]>).data.map(
          (category) => category.id,
        ),
      ).toEqual(reversed);
    });

    it("leaves products uncategorised when a category is deleted", async () => {
      const product = await http()
        .post("/api/admin/products")
        .set(auth())
        .send({
          name: `${tag} In category`,
          price: 1000,
          stock: 1,
          categoryId: second.id,
        })
        .expect(201);
      const productId = (product.body as Envelope<AdminProduct>).data.id;
      await http()
        .delete(`/api/admin/categories/${second.id}`)
        .set(auth())
        .expect(204);
      const reloaded = await http()
        .get(`/api/admin/products/${productId}`)
        .set(auth())
        .expect(200);
      expect(
        (reloaded.body as Envelope<AdminProduct>).data.categoryId,
      ).toBeNull();
      await http()
        .delete(`/api/admin/categories/${first.id}`)
        .set(auth())
        .expect(204);
    });
  });

  describe("uploads", () => {
    it("optimises an uploaded photo to webp and stores it", async () => {
      const photo = await sharp({
        create: {
          width: 3200,
          height: 2400,
          channels: 3,
          background: { r: 120, g: 40, b: 160 },
        },
      })
        .jpeg()
        .toBuffer();
      const response = await http()
        .post("/api/admin/uploads")
        .set(auth())
        .attach("file", photo, { filename: "photo.jpg" })
        .expect(201);
      const uploaded = (response.body as Envelope<UploadedImage>).data;
      expect(uploaded.key).toMatch(/^products\/[0-9a-f-]{36}\.webp$/);
      expect(uploaded.publicUrl).toBe(`https://cdn.test/${uploaded.key}`);
      const record = stored.find((item) => item.key === uploaded.key);
      expect(record?.contentType).toBe("image/webp");
    });

    it("rejects missing and non-image files", async () => {
      await http().post("/api/admin/uploads").set(auth()).expect(400);
      await http()
        .post("/api/admin/uploads")
        .set(auth())
        .attach("file", Buffer.from("not an image"), { filename: "x.jpg" })
        .expect(400);
    });

    it("only deletes well-formed keys", async () => {
      await http()
        .delete("/api/admin/uploads")
        .set(auth())
        .send({ key: "../secrets.txt" })
        .expect(400);
      const key = imageKey();
      await http()
        .delete("/api/admin/uploads")
        .set(auth())
        .send({ key })
        .expect(204);
      expect(deleted).toContain(key);
    });
  });

  describe("products", () => {
    let product: AdminProduct;
    const keyA = imageKey();
    const keyB = imageKey();

    it("creates a product and builds image urls from keys", async () => {
      const response = await http()
        .post("/api/admin/products")
        .set(auth())
        .send({
          name: `${tag} Phone`,
          price: 148000,
          compareAtPrice: 165000,
          stock: 3,
          sku: `${tag}-SKU`,
          brand: "Nova",
          images: [keyA, keyB],
          featured: true,
        })
        .expect(201);
      product = (response.body as Envelope<AdminProduct>).data;
      expect(product.slug).toBe(`${tag}-phone`);
      expect(product.active).toBe(true);
      expect(product.imageUrls).toEqual([
        `https://cdn.test/${keyA}`,
        `https://cdn.test/${keyB}`,
      ]);
    });

    it("validates prices, image keys and categories", async () => {
      await http()
        .post("/api/admin/products")
        .set(auth())
        .send({
          name: `${tag} Bad`,
          price: 1000,
          compareAtPrice: 900,
          stock: 1,
        })
        .expect(422);
      await http()
        .post("/api/admin/products")
        .set(auth())
        .send({ name: `${tag} Bad`, price: 1000, stock: 1, images: ["x.png"] })
        .expect(400);
      await http()
        .post("/api/admin/products")
        .set(auth())
        .send({
          name: `${tag} Bad`,
          price: 1000,
          stock: 1,
          categoryId: "missing",
        })
        .expect(400);
    });

    it("rejects a duplicate sku", async () => {
      const response = await http()
        .post("/api/admin/products")
        .set(auth())
        .send({
          name: `${tag} Clone`,
          price: 1000,
          stock: 1,
          sku: `${tag}-SKU`,
        })
        .expect(409);
      expect(response.body).toMatchObject({ error: { code: "CONFLICT" } });
    });

    it("filters, searches, sorts and paginates", async () => {
      await http()
        .post("/api/admin/products")
        .set(auth())
        .send({ name: `${tag} Cable`, price: 3000, stock: 0, active: false })
        .expect(201);
      const search = await http()
        .get("/api/admin/products")
        .query({ search: tag.toUpperCase(), sort: "price-asc", limit: 1 })
        .set(auth())
        .expect(200);
      const body = search.body as Envelope<AdminProduct[]>;
      expect(body.meta).toMatchObject({ page: 1, limit: 1 });
      expect(body.meta?.total).toBeGreaterThanOrEqual(2);
      expect(body.data[0]?.name).toBe(`${tag} In category`);

      const lowStock = await http()
        .get("/api/admin/products")
        .query({ search: tag, stock: "low" })
        .set(auth());
      expect(
        (lowStock.body as Envelope<AdminProduct[]>).data
          .map((p) => p.name)
          .sort(),
      ).toEqual([`${tag} In category`, `${tag} Phone`]);

      const outOfStock = await http()
        .get("/api/admin/products")
        .query({ search: tag, stock: "out", status: "inactive" })
        .set(auth());
      expect(
        (outOfStock.body as Envelope<AdminProduct[]>).data.map((p) => p.name),
      ).toEqual([`${tag} Cable`]);

      const featured = await http()
        .get("/api/admin/products")
        .query({ search: tag, featured: "true" })
        .set(auth());
      expect(
        (featured.body as Envelope<AdminProduct[]>).data.map((p) => p.name),
      ).toEqual([`${tag} Phone`]);

      await http()
        .get("/api/admin/products")
        .query({ limit: 500 })
        .set(auth())
        .expect(400);
    });

    it("updates fields and deletes removed images from storage", async () => {
      const response = await http()
        .patch(`/api/admin/products/${product.id}`)
        .set(auth())
        .send({ price: 150000, compareAtPrice: null, images: [keyB] })
        .expect(200);
      const updated = (response.body as Envelope<AdminProduct>).data;
      expect(updated.price).toBe(150000);
      expect(updated.compareAtPrice).toBeNull();
      expect(updated.images).toEqual([keyB]);
      expect(deleted).toContain(keyA);
      expect(deleted).not.toContain(keyB);
      await http()
        .patch(`/api/admin/products/${product.id}`)
        .set(auth())
        .send({ compareAtPrice: 100 })
        .expect(422);
    });

    it("activates and deactivates in bulk", async () => {
      const response = await http()
        .post("/api/admin/products/status")
        .set(auth())
        .send({ ids: [product.id], active: false })
        .expect(200);
      expect(
        (response.body as Envelope<{ updated: number }>).data.updated,
      ).toBe(1);
      const reloaded = await http()
        .get(`/api/admin/products/${product.id}`)
        .set(auth());
      expect((reloaded.body as Envelope<AdminProduct>).data.active).toBe(false);
    });

    it("deletes a product and its images", async () => {
      await http()
        .delete(`/api/admin/products/${product.id}`)
        .set(auth())
        .expect(204);
      expect(deleted).toContain(keyB);
      await http()
        .get(`/api/admin/products/${product.id}`)
        .set(auth())
        .expect(404);
      await http()
        .delete(`/api/admin/products/${product.id}`)
        .set(auth())
        .expect(404);
    });
  });
});
