import { TZDate } from "@date-fns/tz";
import { format, startOfDay, subDays } from "date-fns";

const LAGOS = "Africa/Lagos";
const DAY_KEY_FORMAT = "yyyy-MM-dd";

export function lagosDayKey(date: Date): string {
  return format(new TZDate(date, LAGOS), DAY_KEY_FORMAT);
}

export function lagosDayStart(key: string): Date {
  const [year = 0, month = 1, day = 1] = key.split("-").map(Number);
  return new Date(
    startOfDay(new TZDate(year, month - 1, day, LAGOS)).getTime(),
  );
}

export function lastDayKeys(count: number, now: Date): string[] {
  const today = new TZDate(now, LAGOS);
  return Array.from({ length: count }, (_, index) =>
    format(subDays(today, count - 1 - index), DAY_KEY_FORMAT),
  );
}
