import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { SettingsModule } from "../settings/settings.module.js";
import { AdminOrdersController } from "./admin-orders.controller.js";
import { OrdersController } from "./orders.controller.js";
import { OrdersService } from "./orders.service.js";

@Module({
  imports: [AuthModule, SettingsModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
