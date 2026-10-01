import { Module } from "@nestjs/common";
import { SettingsModule } from "../settings/settings.module.js";
import { OrderExpiryService } from "./order-expiry.service.js";
import { PaystackModule } from "./paystack.module.js";
import { PaymentsController } from "./payments.controller.js";
import { PaymentsService } from "./payments.service.js";

@Module({
  imports: [SettingsModule, PaystackModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, OrderExpiryService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
