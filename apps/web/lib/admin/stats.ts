import type { AdminStats } from "@repo/types";
import { adminRequest } from "./client";

export const statsKeys = {
  all: ["admin", "stats"] as const,
};

export function getStats(): Promise<AdminStats> {
  return adminRequest<AdminStats>({ url: "/admin/stats" });
}
