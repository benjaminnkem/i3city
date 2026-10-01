import { ServiceUnavailableException } from "@nestjs/common";
import { HealthService } from "./health.service.js";
import type { PrismaService } from "../prisma/prisma.service.js";

function serviceWith(queryRaw: () => Promise<unknown>): HealthService {
  const prisma = { $queryRaw: queryRaw } as unknown as PrismaService;
  return new HealthService(prisma);
}

describe("HealthService", () => {
  it("reports the database as up", async () => {
    const service = serviceWith(() => Promise.resolve([{ "?column?": 1 }]));
    await expect(service.check()).resolves.toEqual({
      status: "ok",
      database: "up",
    });
  });

  it("throws when the database is unreachable", async () => {
    const service = serviceWith(() => Promise.reject(new Error("down")));
    await expect(service.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
