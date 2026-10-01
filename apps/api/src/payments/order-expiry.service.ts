import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PaymentsService } from "./payments.service.js";

@Injectable()
export class OrderExpiryService {
  private readonly logger = new Logger(OrderExpiryService.name);

  constructor(private readonly payments: PaymentsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async run(): Promise<void> {
    if (process.env.NODE_ENV === "test") {
      return;
    }
    try {
      const cancelled = await this.payments.expireOverdue();
      if (cancelled > 0) {
        this.logger.log(
          `Cancelled ${cancelled} unpaid order(s) and released their stock`,
        );
      }
    } catch (error) {
      this.logger.error(
        error instanceof Error ? error.message : "Order expiry failed",
      );
    }
  }
}
