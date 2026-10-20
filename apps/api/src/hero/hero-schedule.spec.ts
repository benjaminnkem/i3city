import {
  heroSlideStatus,
  isDateKey,
  toSchedule,
  toScheduleDates,
} from "./hero-schedule.js";

describe("hero schedule", () => {
  it("runs from the start of the first Lagos day to the end of the last", () => {
    const schedule = toSchedule({
      startDate: "2026-11-27",
      endDate: "2026-11-30",
    });
    expect(schedule.startsAt?.toISOString()).toBe("2026-11-26T23:00:00.000Z");
    expect(schedule.endsAt?.toISOString()).toBe("2026-11-30T23:00:00.000Z");
    expect(toScheduleDates(schedule)).toEqual({
      startDate: "2026-11-27",
      endDate: "2026-11-30",
    });
  });

  it("leaves open ends empty", () => {
    expect(toSchedule({ startDate: null, endDate: null })).toEqual({
      startsAt: null,
      endsAt: null,
    });
  });

  it("rejects impossible dates", () => {
    expect(isDateKey("2026-02-28")).toBe(true);
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("2026-13-01")).toBe(false);
  });

  it("reports live, scheduled, ended and off", () => {
    const schedule = toSchedule({
      startDate: "2026-11-27",
      endDate: "2026-11-30",
    });
    const at = (iso: string) => new Date(iso);
    const slide = { ...schedule, active: true };
    expect(heroSlideStatus(slide, at("2026-11-26T22:59:59Z"))).toBe(
      "SCHEDULED",
    );
    expect(heroSlideStatus(slide, at("2026-11-26T23:00:00Z"))).toBe("LIVE");
    expect(heroSlideStatus(slide, at("2026-11-30T22:59:59Z"))).toBe("LIVE");
    expect(heroSlideStatus(slide, at("2026-11-30T23:00:00Z"))).toBe("ENDED");
    expect(
      heroSlideStatus({ ...slide, active: false }, at("2026-11-28T12:00:00Z")),
    ).toBe("OFF");
    expect(
      heroSlideStatus(
        { startsAt: null, endsAt: null, active: true },
        at("2030-01-01T00:00:00Z"),
      ),
    ).toBe("LIVE");
  });
});
