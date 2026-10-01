import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PaystackModule } from "../payments/paystack.module.js";
import { SettingsController } from "./settings.controller.js";
import { SettingsService } from "./settings.service.js";

@Module({
  imports: [AuthModule, PaystackModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
