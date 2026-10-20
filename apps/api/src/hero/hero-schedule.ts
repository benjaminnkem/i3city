import type { HeroSlideStatus } from "@repo/types";
import { addDays } from "date-fns";
import type { Prisma } from "../generated/prisma/client.js";
import { lagosDayKey, lagosDayStart } from "../common/lagos-time.js";

export interface Schedule {
  startsAt: Date | null;
  endsAt: Date | null;
}

export interface ScheduleDates {
  startDate: string | null;
  endDate: string | null;
}

export function isDateKey(key: string): boolean {
  return lagosDayKey(lagosDayStart(key)) === key;
}

export function toSchedule({ startDate, endDate }: ScheduleDates): Schedule {
  return {
    startsAt: startDate ? lagosDayStart(startDate) : null,
    endsAt: endDate ? addDays(lagosDayStart(endDate), 1) : null,
  };
}

export function toScheduleDates({ startsAt, endsAt }: Schedule): ScheduleDates {
  return {
    startDate: startsAt ? lagosDayKey(startsAt) : null,
    endDate: endsAt ? lagosDayKey(new Date(endsAt.getTime() - 1)) : null,
  };
}

export function heroSlideStatus(
  slide: Schedule & { active: boolean },
  now: Date,
): HeroSlideStatus {
  if (!slide.active) return "OFF";
  if (slide.endsAt && slide.endsAt <= now) return "ENDED";
  if (slide.startsAt && slide.startsAt > now) return "SCHEDULED";
  return "LIVE";
}

export function liveSlideWhere(now: Date): Prisma.HeroSlideWhereInput {
  return {
    active: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    ],
  };
}
