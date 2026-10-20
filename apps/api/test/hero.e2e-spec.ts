import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type {
  AdminHeroSlide,
  HeroSlideInput,
  LoginResult,
  PublicHeroSlide,
} from "@repo/types";
import bcrypt from "bcryptjs";
import { addDays, format } from "date-fns";
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

const imageKey = () => `products/${randomUUID()}.webp`;
const dayKey = (offset: number) =>
  format(addDays(new Date(), offset), "yyyy-MM-dd");

describe("Hero slides (e2e)", () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;
  let liveProductId: string;
  let hiddenProductId: string;
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
  const slideInput = (patch: Partial<HeroSlideInput>): HeroSlideInput => ({
    kind: "PRODUCTS",
    headline: `${tag} Headline`,
    subtext: "Subtext",
    ctaLabel: "Shop now",
    ctaHref: "/shop",
    image: null,
    imageAlt: "",
    productIds: [liveProductId],
    tone: null,
    active: true,
    startDate: null,
    endDate: null,
    ...patch,
  });
  const create = async (patch: Partial<HeroSlideInput>) =>
    (
      (
        await http()
          .post("/api/admin/hero")
          .set(auth())
          .send(slideInput(patch))
          .expect(201)
      ).body as Envelope<AdminHeroSlide>
    ).data;
  const publicSlides = async () =>
    (
      (await http().get("/api/hero").expect(200)).body as Envelope<
        PublicHeroSlide[]
      >
    ).data.filter((slide) => slide.headline.startsWith(tag));

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
    const live = await prisma.product.create({
      data: { name: `${tag} Live`, slug: `${tag}-live`, price: 1000, stock: 3 },
    });
    const hidden = await prisma.product.create({
      data: {
        name: `${tag} Hidden`,
        slug: `${tag}-hidden`,
        price: 1000,
        stock: 3,
        active: false,
      },
    });
    liveProductId = live.id;
    hiddenProductId = hidden.id;
  });

  afterAll(async () => {
    await prisma.heroSlide.deleteMany({
      where: { headline: { startsWith: tag } },
    });
    await prisma.product.deleteMany({ where: { name: { startsWith: tag } } });
    await prisma.adminUser.deleteMany({ where: { email } });
    await app.close();
  });

  it("requires an access token for admin routes", async () => {
    await http().get("/api/admin/hero").expect(401);
    await http().post("/api/admin/hero").send({}).expect(401);
  });

  it("shows product slides with only active products", async () => {
    const slide = await create({
      productIds: [hiddenProductId, liveProductId],
    });
    expect(slide.status).toBe("LIVE");
    expect(slide.products.map((product) => product.id)).toEqual([
      hiddenProductId,
      liveProductId,
    ]);
    const [shown] = await publicSlides();
    expect(shown?.products.map((product) => product.id)).toEqual([
      liveProductId,
    ]);

    await create({
      headline: `${tag} Only hidden`,
      productIds: [hiddenProductId],
    });
    expect((await publicSlides()).map((item) => item.headline)).toEqual([
      `${tag} Headline`,
    ]);
    await prisma.heroSlide.deleteMany({
      where: { headline: { startsWith: tag } },
    });
  });

  it("hides slides that are off, scheduled or ended", async () => {
    const off = await create({ headline: `${tag} Off`, active: false });
    const later = await create({
      headline: `${tag} Later`,
      startDate: dayKey(3),
      endDate: dayKey(5),
    });
    const ended = await create({
      headline: `${tag} Ended`,
      startDate: dayKey(-5),
      endDate: dayKey(-2),
    });
    const now = await create({
      headline: `${tag} Now`,
      startDate: dayKey(-1),
      endDate: dayKey(1),
    });
    expect([off.status, later.status, ended.status, now.status]).toEqual([
      "OFF",
      "SCHEDULED",
      "ENDED",
      "LIVE",
    ]);
    expect(later.startDate).toBe(dayKey(3));
    expect(later.endDate).toBe(dayKey(5));
    expect((await publicSlides()).map((item) => item.headline)).toEqual([
      `${tag} Now`,
    ]);
    await prisma.heroSlide.deleteMany({
      where: { headline: { startsWith: tag } },
    });
  });

  it("stores banner images and cleans them up", async () => {
    await http()
      .post("/api/admin/hero")
      .set(auth())
      .send(slideInput({ kind: "IMAGE", productIds: [] }))
      .expect(400);
    const first = imageKey();
    const slide = await create({
      kind: "IMAGE",
      image: first,
      imageAlt: "Phones on a table",
      productIds: [liveProductId],
    });
    expect(slide.imageUrl).toBe(`https://cdn.test/${first}`);
    expect(slide.productIds).toEqual([]);
    const [shown] = await publicSlides();
    expect(shown).toMatchObject({
      kind: "IMAGE",
      imageUrl: `https://cdn.test/${first}`,
      imageAlt: "Phones on a table",
      products: [],
    });

    const second = imageKey();
    await http()
      .put(`/api/admin/hero/${slide.id}`)
      .set(auth())
      .send(slideInput({ kind: "IMAGE", image: second, imageAlt: "New" }))
      .expect(200);
    expect(deleted).toContain(first);

    await http().delete(`/api/admin/hero/${slide.id}`).set(auth()).expect(204);
    expect(deleted).toContain(second);
    await http().get(`/api/admin/hero/${slide.id}`).set(auth()).expect(404);
  });

  it("reorders slides", async () => {
    const a = await create({ headline: `${tag} A` });
    const b = await create({ headline: `${tag} B` });
    await http()
      .put("/api/admin/hero/order")
      .set(auth())
      .send({ ids: [a.id] })
      .expect(400);
    const others = (
      (await http().get("/api/admin/hero").set(auth()).expect(200))
        .body as Envelope<AdminHeroSlide[]>
    ).data
      .map((item) => item.id)
      .filter((id) => id !== a.id && id !== b.id);
    const reordered = await http()
      .put("/api/admin/hero/order")
      .set(auth())
      .send({ ids: [b.id, a.id, ...others] })
      .expect(200);
    expect(
      (reordered.body as Envelope<AdminHeroSlide[]>).data
        .slice(0, 2)
        .map((item) => item.id),
    ).toEqual([b.id, a.id]);
    expect((await publicSlides()).map((item) => item.headline)).toEqual([
      `${tag} B`,
      `${tag} A`,
    ]);
  });

  it("rejects unsafe links, bad dates and unknown products", async () => {
    for (const patch of [
      { ctaHref: "https://example.com" },
      { ctaHref: "//example.com" },
      { ctaHref: "javascript:alert(1)" },
      { startDate: "2026-02-30" },
      { startDate: dayKey(3), endDate: dayKey(1) },
      { productIds: ["missing-product"] },
      { productIds: [] },
      { headline: "" },
      { tone: 7 as never },
    ]) {
      await http()
        .post("/api/admin/hero")
        .set(auth())
        .send(slideInput(patch))
        .expect(400);
    }
  });
});
