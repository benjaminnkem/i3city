import { lagosDayKey, lagosDayStart, lastDayKeys } from "./lagos-time.js";

describe("lagos-time", () => {
  it("assigns a UTC evening instant to the next Lagos day", () => {
    expect(lagosDayKey(new Date("2026-10-01T23:30:00Z"))).toBe("2026-10-02");
    expect(lagosDayKey(new Date("2026-10-01T22:30:00Z"))).toBe("2026-10-01");
  });

  it("starts the Lagos day at 23:00 UTC the day before", () => {
    expect(lagosDayStart("2026-10-02").toISOString()).toBe(
      "2026-10-01T23:00:00.000Z",
    );
  });

  it("lists consecutive day keys ending today", () => {
    expect(lastDayKeys(3, new Date("2026-10-01T12:00:00Z"))).toEqual([
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
    ]);
  });

  it("crosses a month boundary", () => {
    expect(lastDayKeys(2, new Date("2026-11-01T08:00:00Z"))).toEqual([
      "2026-10-31",
      "2026-11-01",
    ]);
  });
});
