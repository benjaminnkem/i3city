import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types.js";
import { AppModule } from "../src/app.module.js";
import { configureApp } from "../src/app.setup.js";

describe("Health (e2e)", () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /api/health wraps the result in the success envelope", () => {
    return request(app.getHttpServer())
      .get("/api/health")
      .expect(200)
      .expect({ success: true, data: { status: "ok", database: "up" } });
  });

  it("returns the error envelope for an unknown route", () => {
    return request(app.getHttpServer())
      .get("/api/nope")
      .expect(404)
      .expect({
        success: false,
        error: { code: "NOT_FOUND", message: "Cannot GET /api/nope" },
      });
  });

  it("returns the error envelope for malformed JSON", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{ not json");
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "BAD_REQUEST" },
    });
  });
});
