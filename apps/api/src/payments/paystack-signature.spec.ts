import { createHmac } from "node:crypto";
import {
  codeFromReference,
  nextReference,
  toKobo,
  verifyPaystackSignature,
} from "./paystack-signature.js";

const secret = "sk_test_example";
const body = Buffer.from(
  JSON.stringify({ event: "charge.success", data: { reference: "I3-ABC234" } }),
);
const sign = (payload: Buffer, key = secret) =>
  createHmac("sha512", key).update(payload).digest("hex");

describe("verifyPaystackSignature", () => {
  it("accepts the HMAC SHA512 of the raw body", () => {
    expect(verifyPaystackSignature(secret, body, sign(body))).toBe(true);
  });

  it("rejects a body that was changed", () => {
    expect(verifyPaystackSignature(secret, Buffer.from("{}"), sign(body))).toBe(
      false,
    );
  });

  it("rejects a signature made with another key", () => {
    expect(
      verifyPaystackSignature(secret, body, sign(body, "sk_test_other")),
    ).toBe(false);
  });

  it("rejects missing or malformed signatures", () => {
    expect(verifyPaystackSignature(secret, body, undefined)).toBe(false);
    expect(verifyPaystackSignature(secret, undefined, sign(body))).toBe(false);
    expect(verifyPaystackSignature(secret, body, "not-hex")).toBe(false);
    expect(verifyPaystackSignature(secret, body, "")).toBe(false);
  });
});

describe("payment references", () => {
  it("uses the order code for the first attempt and numbers retries", () => {
    expect(nextReference("I3-ABC234", null)).toBe("I3-ABC234");
    expect(nextReference("I3-ABC234", "I3-ABC234")).toBe("I3-ABC234-2");
    expect(nextReference("I3-ABC234", "I3-ABC234-2")).toBe("I3-ABC234-3");
  });

  it("finds the order code in any reference", () => {
    expect(codeFromReference("I3-ABC234")).toBe("I3-ABC234");
    expect(codeFromReference("I3-ABC234-7")).toBe("I3-ABC234");
    expect(codeFromReference("random-reference")).toBeNull();
    expect(codeFromReference("I3-ABC234-x")).toBeNull();
  });

  it("converts naira to kobo", () => {
    expect(toKobo(148000)).toBe(14_800_000);
  });
});
