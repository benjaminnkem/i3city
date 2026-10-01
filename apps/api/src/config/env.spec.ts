import { loadEnv } from "./env.js";

const base = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  JWT_SECRET: "a-secret-that-is-at-least-32-characters-long",
};

const storage = {
  R2_ACCOUNT_ID: "account",
  R2_ACCESS_KEY_ID: "key",
  R2_SECRET_ACCESS_KEY: "secret",
  R2_BUCKET_NAME: "bucket",
  R2_PUBLIC_URL: "https://cdn.example.com",
};

describe("loadEnv", () => {
  it("applies defaults", () => {
    const env = loadEnv(base);
    expect(env.PORT).toBe(4000);
    expect(env.WEB_URL).toBe("http://localhost:3000");
    expect(env.ACCESS_TOKEN_TTL_SECONDS).toBe(900);
    expect(env.REFRESH_TOKEN_TTL_DAYS).toBe(7);
    expect(env.NODE_ENV).toBe("development");
  });

  it("treats blank values like missing ones", () => {
    const env = loadEnv({
      ...base,
      RESEND_API_KEY: "",
      EMAIL_FROM: "",
      R2_ACCOUNT_ID: "",
      PORT: "",
    });
    expect(env.RESEND_API_KEY).toBeUndefined();
    expect(env.EMAIL_FROM).toBe("i3City <onboarding@resend.dev>");
    expect(env.PORT).toBe(4000);
  });

  it("coerces numeric values", () => {
    expect(loadEnv({ ...base, PORT: "5000" }).PORT).toBe(5000);
  });

  it("reports every missing or invalid variable", () => {
    expect(() => loadEnv({ JWT_SECRET: "short" })).toThrowError(
      /DATABASE_URL[\s\S]*JWT_SECRET/,
    );
  });

  it("rejects a non-positive ttl", () => {
    expect(() =>
      loadEnv({ ...base, ACCESS_TOKEN_TTL_SECONDS: "0" }),
    ).toThrowError(/ACCESS_TOKEN_TTL_SECONDS/);
  });

  it("allows storage to be absent outside production", () => {
    expect(loadEnv(base).R2_BUCKET_NAME).toBeUndefined();
  });

  it("rejects partial storage configuration", () => {
    expect(() => loadEnv({ ...base, R2_ACCOUNT_ID: "account" })).toThrowError(
      /R2_BUCKET_NAME/,
    );
  });

  it("requires storage in production", () => {
    expect(() => loadEnv({ ...base, NODE_ENV: "production" })).toThrowError(
      /R2_ACCOUNT_ID/,
    );
    expect(
      loadEnv({ ...base, ...storage, NODE_ENV: "production" }).R2_BUCKET_NAME,
    ).toBe("bucket");
  });
});
