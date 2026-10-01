import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import type { AdminSettings, ShippingRateInfo } from "@repo/types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import {
  UpdateSettingsDto,
  UpdateShippingRatesDto,
} from "./dto/settings.dto.js";
import { SettingsService } from "./settings.service.js";

@Controller("admin")
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get("settings")
  get(): Promise<AdminSettings> {
    return this.settings.get();
  }

  @Put("settings")
  update(@Body() dto: UpdateSettingsDto): Promise<AdminSettings> {
    return this.settings.update(dto);
  }

  @Get("shipping-rates")
  listRates(): Promise<ShippingRateInfo[]> {
    return this.settings.listRates();
  }

  @Put("shipping-rates")
  updateRates(
    @Body() dto: UpdateShippingRatesDto,
  ): Promise<ShippingRateInfo[]> {
    return this.settings.updateRates(dto);
  }
}
