import { Controller, Get, UseGuards } from "@nestjs/common";
import type { AdminStats } from "@repo/types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { StatsService } from "./stats.service.js";

@Controller("admin/stats")
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get()
  overview(): Promise<AdminStats> {
    return this.stats.overview();
  }
}
