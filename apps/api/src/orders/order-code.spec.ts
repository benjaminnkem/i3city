import { ORDER_CODE_PATTERN, generateOrderCode } from "./order-code.js";

describe("order codes", () => {
  it("uses the I3 prefix and six unambiguous characters", () => {
    for (let index = 0; index < 200; index += 1) {
      const code = generateOrderCode();
      expect(code).toMatch(ORDER_CODE_PATTERN);
      expect(code.slice(3)).not.toMatch(/[01ILO]/);
    }
  });

  it("is built from the picker it is given", () => {
    expect(generateOrderCode(() => 0)).toBe("I3-AAAAAA");
  });
});
