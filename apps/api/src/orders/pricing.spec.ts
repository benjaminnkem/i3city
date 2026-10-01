import {
  calculateShipping,
  formatNigerianPhone,
  normaliseNigerianPhone,
  stateLabel,
} from "@repo/types";

const rates = [
  { state: "Lagos", fee: 3500, etaDays: "1 to 2 days" },
  { state: "Kano", fee: 8000, etaDays: "4 to 6 days" },
];

describe("calculateShipping", () => {
  it("uses the rate for the delivery state", () => {
    expect(
      calculateShipping({
        subtotal: 20000,
        state: "Kano",
        rates,
        defaultFee: 5000,
        freeShippingOver: null,
      }),
    ).toEqual({ fee: 8000, etaDays: "4 to 6 days", free: false });
  });

  it("falls back to the default fee when a state has no rate", () => {
    expect(
      calculateShipping({
        subtotal: 20000,
        state: "Imo",
        rates,
        defaultFee: 5000,
        freeShippingOver: null,
      }),
    ).toEqual({ fee: 5000, etaDays: null, free: false });
  });

  it("is free at or above the free shipping threshold", () => {
    const quote = calculateShipping({
      subtotal: 100000,
      state: "Kano",
      rates,
      defaultFee: 5000,
      freeShippingOver: 100000,
    });
    expect(quote).toEqual({ fee: 0, etaDays: "4 to 6 days", free: true });
  });

  it("charges below the threshold", () => {
    expect(
      calculateShipping({
        subtotal: 99999,
        state: "Lagos",
        rates,
        defaultFee: 5000,
        freeShippingOver: 100000,
      }).fee,
    ).toBe(3500);
  });
});

describe("Nigerian phone numbers", () => {
  it.each([
    ["08012345678", "2348012345678"],
    ["0801 234 5678", "2348012345678"],
    ["+234 801 234 5678", "2348012345678"],
    ["2348012345678", "2348012345678"],
    ["0703-123-4567", "2347031234567"],
    ["09012345678", "2349012345678"],
  ])("normalises %s", (input, expected) => {
    expect(normaliseNigerianPhone(input)).toBe(expected);
  });

  it.each([
    "",
    "12345",
    "0601234567",
    "080123456789",
    "+1 415 555 2671",
    "abc",
  ])("rejects %s", (input) => {
    expect(normaliseNigerianPhone(input)).toBeNull();
  });

  it("formats an international number for display", () => {
    expect(formatNigerianPhone("2348012345678")).toBe("0801 234 5678");
  });
});

describe("stateLabel", () => {
  it("expands FCT", () => {
    expect(stateLabel("FCT")).toBe("FCT (Abuja)");
    expect(stateLabel("Lagos")).toBe("Lagos");
  });
});
