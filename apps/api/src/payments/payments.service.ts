import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { type PublicOrder } from "@repo/types";
import { ENV, type Env } from "../config/env.js";
import { EmailService } from "../email/email.service.js";
import {
  customerPaymentEmail,
  ownerPaymentEmail,
  type OrderEmailData,
} from "../email/order-emails.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { SettingsService } from "../settings/settings.service.js";
import { StorageService } from "../storage/storage.service.js";
import {
  ORDER_INCLUDE,
  toPublicOrder,
  type OrderRow,
} from "../orders/order.mapper.js";
import { restockItems } from "../orders/order-stock.js";
import { orderEmailData } from "../orders/order-email-data.js";
import {
  codeFromReference,
  nextReference,
  toKobo,
} from "./paystack-signature.js";
import { PaystackService } from "./paystack.service.js";

export type SettleResult =
  "paid" | "already_paid" | "pending" | "failed" | "rejected" | "unknown_order";

const PAYABLE_STATUSES: OrderRow["paymentStatus"][] = ["UNPAID", "FAILED"];
const CLOSED_STATUSES: OrderRow["status"][] = ["CANCELLED", "DELIVERED"];

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly settings: SettingsService,
    private readonly email: EmailService,
    private readonly paystack: PaystackService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async available(): Promise<boolean> {
    const settings = await this.settings.get();
    return settings.paystackEnabled && this.paystack.configured;
  }

  canPay(row: OrderRow, available: boolean): boolean {
    return (
      available &&
      PAYABLE_STATUSES.includes(row.paymentStatus) &&
      !CLOSED_STATUSES.includes(row.status)
    );
  }

  async toPublic(row: OrderRow): Promise<PublicOrder> {
    return toPublicOrder(
      row,
      this.storage,
      this.canPay(row, await this.available()),
    );
  }

  async start(row: OrderRow, email: string): Promise<string> {
    const reference = nextReference(row.code, row.paystackRef);
    const { authorizationUrl } = await this.paystack.initialize({
      email,
      amountKobo: toKobo(row.total),
      reference,
      callbackUrl: `${this.env.WEB_URL}/order/${row.code}`,
      orderCode: row.code,
    });
    await this.prisma.order.update({
      where: { id: row.id },
      data: { paystackRef: reference, paymentStatus: "UNPAID" },
    });
    return authorizationUrl;
  }

  async startForExisting(
    code: string,
    emailInput: string | undefined,
  ): Promise<string> {
    const row = await this.find(code);
    const available = await this.available();
    if (!available) {
      throw new UnprocessableEntityException(
        "Online payment is not available right now",
      );
    }
    if (!this.canPay(row, available)) {
      throw new UnprocessableEntityException(
        "This order cannot be paid online",
      );
    }
    const email = row.email ?? emailInput;
    if (!email) {
      throw new UnprocessableEntityException(
        "Add your email address to pay online",
      );
    }
    if (!row.email) {
      await this.prisma.order.update({
        where: { id: row.id },
        data: { email },
      });
    }
    return this.start(row, email);
  }

  async verifyForCustomer(
    code: string,
    reference: string | undefined,
  ): Promise<PublicOrder> {
    const row = await this.find(code);
    if (row.paymentStatus !== "PAID" && row.paystackRef) {
      const candidate =
        reference && codeFromReference(reference) === row.code
          ? reference
          : row.paystackRef;
      try {
        await this.settle(candidate);
      } catch (error) {
        this.logger.warn(
          `Could not verify ${candidate}: ${error instanceof Error ? error.message : "unknown error"}`,
        );
      }
    }
    return this.toPublic(await this.find(code));
  }

  async settle(reference: string): Promise<SettleResult> {
    const code = codeFromReference(reference);
    if (!code) {
      return "unknown_order";
    }
    const order = await this.prisma.order.findUnique({
      where: { code },
      include: ORDER_INCLUDE,
    });
    if (!order) {
      return "unknown_order";
    }
    if (order.paymentStatus === "PAID") {
      return "already_paid";
    }
    const transaction = await this.paystack.verify(reference);
    if (transaction.status === "success") {
      if (
        transaction.currency !== "NGN" ||
        transaction.amount !== toKobo(order.total)
      ) {
        this.logger.warn(
          `Rejected payment ${reference}: expected ${toKobo(order.total)} NGN, got ${transaction.amount} ${transaction.currency}`,
        );
        return "rejected";
      }
      const outcome = await this.markPaid(order.id, reference);
      if (outcome.first) {
        void this.notifyPaid(order.id, outcome.wasCancelled);
      }
      return "paid";
    }
    if (transaction.status === "failed" || transaction.status === "reversed") {
      await this.prisma.order.updateMany({
        where: { id: order.id, paymentStatus: "UNPAID" },
        data: { paymentStatus: "FAILED" },
      });
      return "failed";
    }
    return "pending";
  }

  async expireOverdue(now = new Date()): Promise<number> {
    const due = await this.prisma.order.findMany({
      where: {
        paymentMethod: "PAYSTACK",
        status: "PENDING_PAYMENT",
        paymentStatus: { not: "PAID" },
        expiresAt: { lt: now },
      },
      select: { id: true, paystackRef: true },
    });
    let cancelled = 0;
    for (const order of due) {
      if (order.paystackRef) {
        try {
          if ((await this.settle(order.paystackRef)) === "paid") {
            continue;
          }
        } catch (error) {
          this.logger.warn(
            `Skipped expiring ${order.id}, could not verify: ${error instanceof Error ? error.message : "unknown error"}`,
          );
          continue;
        }
      }
      if (await this.cancelUnpaid(order.id, "Payment window expired")) {
        cancelled += 1;
      }
    }
    return cancelled;
  }

  async cancelUnpaid(orderId: string, note: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: {
          id: orderId,
          status: "PENDING_PAYMENT",
          paymentStatus: { not: "PAID" },
        },
        data: { status: "CANCELLED" },
      });
      if (claimed.count === 0) {
        return false;
      }
      const items = await tx.orderItem.findMany({ where: { orderId } });
      await restockItems(tx, items);
      await tx.orderEvent.create({
        data: { orderId, status: "CANCELLED", note },
      });
      return true;
    });
  }

  private async markPaid(
    orderId: string,
    reference: string,
  ): Promise<{ first: boolean; wasCancelled: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: { id: orderId, paymentStatus: { not: "PAID" } },
        data: {
          paymentStatus: "PAID",
          paidAt: new Date(),
          paystackRef: reference,
        },
      });
      if (claimed.count === 0) {
        return { first: false, wasCancelled: false };
      }
      const current = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
      });
      if (
        current.status === "PENDING_PAYMENT" ||
        current.status === "AWAITING_CONFIRMATION"
      ) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: "CONFIRMED" },
        });
        await tx.orderEvent.create({
          data: { orderId, status: "CONFIRMED", note: "Payment received" },
        });
      }
      return { first: true, wasCancelled: current.status === "CANCELLED" };
    });
  }

  private async notifyPaid(
    orderId: string,
    wasCancelled: boolean,
  ): Promise<void> {
    try {
      const [row, settings] = await Promise.all([
        this.prisma.order.findUniqueOrThrow({
          where: { id: orderId },
          include: ORDER_INCLUDE,
        }),
        this.settings.get(),
      ]);
      const data: OrderEmailData = orderEmailData(row);
      if (settings.supportEmail) {
        const owner = ownerPaymentEmail(
          data,
          `${this.env.WEB_URL}/admin/orders/${row.id}`,
          wasCancelled,
        );
        await this.email.send({ ...owner, to: settings.supportEmail });
      }
      if (row.email && !wasCancelled) {
        const customer = customerPaymentEmail(
          data,
          settings.storeName,
          `${this.env.WEB_URL}/order/${row.code}`,
        );
        await this.email.send({ ...customer, to: row.email });
      }
    } catch (error) {
      this.logger.warn(
        `Could not send payment emails for ${orderId}: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  private async find(code: string): Promise<OrderRow> {
    const row = await this.prisma.order.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: ORDER_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException("We could not find that order");
    }
    return row;
  }
}
