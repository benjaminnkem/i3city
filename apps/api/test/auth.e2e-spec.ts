import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import bcrypt from "bcryptjs";
import request from "supertest";
import type { App } from "supertest/types.js";
import type { AccessGrant, LoginResult } from "@repo/types";
import { AppModule } from "../src/app.module.js";
import { configureApp } from "../src/app.setup.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

interface Envelope<T> {
  success: true;
  data: T;
}

describe("Auth (e2e)", () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const email = `admin-${randomUUID()}@test.local`;
  const password = "correct-horse-battery";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.adminUser.create({
      data: { email, passwordHash: await bcrypt.hash(password, 4) },
    });
  });

  afterAll(async () => {
    await prisma.adminUser.deleteMany({ where: { email } });
    await app.close();
  });

  async function login(): Promise<LoginResult> {
    const response = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email, password })
      .expect(200);
    return (response.body as Envelope<LoginResult>).data;
  }

  it("rejects a wrong password with the error envelope", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email, password: "nope" })
      .expect(401);
    expect(response.body).toEqual({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Invalid email or password" },
    });
  });

  it("rejects an unknown email", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "nobody@test.local", password })
      .expect(401);
  });

  it("lists validation problems per field", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "not-an-email", password: "" })
      .expect(400);
    const body = response.body as {
      success: boolean;
      error: { code: string; details: { field: string }[] };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details.map((detail) => detail.field).sort()).toEqual([
      "email",
      "password",
    ]);
  });

  it("logs in and returns tokens with expiry times", async () => {
    const body = await login();
    expect(body.user.email).toBe(email);
    expect(body.accessTokenExpiresAt).toBeGreaterThan(Date.now());
    expect(body.refreshTokenExpiresAt).toBeGreaterThan(
      body.accessTokenExpiresAt,
    );
  });

  it("serves /me with a valid access token only", async () => {
    const { accessToken } = await login();
    await request(app.getHttpServer()).get("/api/auth/me").expect(401);
    await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Authorization", "Bearer garbage")
      .expect(401);
    const response = await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { email },
    });
  });

  it("issues a new access token from a refresh token", async () => {
    const { refreshToken } = await login();
    const response = await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refreshToken })
      .expect(200);
    const grant = (response.body as Envelope<AccessGrant>).data;
    await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${grant.accessToken}`)
      .expect(200);
  });

  it("rejects an unknown refresh token", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refreshToken: "unknown" })
      .expect(401);
  });

  it("revokes the refresh token on logout", async () => {
    const { refreshToken } = await login();
    await request(app.getHttpServer())
      .post("/api/auth/logout")
      .send({ refreshToken })
      .expect(204);
    await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refreshToken })
      .expect(401);
  });

  it("rejects an expired refresh token", async () => {
    const { refreshToken } = await login();
    await prisma.refreshToken.updateMany({
      where: { adminUser: { email } },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refreshToken })
      .expect(401);
  });
});
