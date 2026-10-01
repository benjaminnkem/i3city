import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ORDER_TRANSITIONS,
  calculateShipping,
  formatNigerianPhone,
  type AdminOrder,
  type AdminOrderListItem,
  type AdminSettings,
  type CreateOrderResult,
  type OrderSort,
  type PublicOrder,
} from "@repo/types";
import { ENV, type Env } from "../config/env.js";
import { paginate, type Paginated } from "../common/paginated.js";
import { isUniqueViolation } from "../common/prisma-errors.js";
import { EmailService } from "../email/email.service.js";
import {
  customerConfirmationEmail,
  customerShippedEmail,
  ownerNewOrderEmail,
  type OrderEmailData,
} from "../email/order-emails.js";
import type { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { SettingsService } from "../settings/settings.service.js";
import { StorageService } from "../storage/storage.service.js";
import type {
  CreateOrderDto,
  OrderListQueryDto,
  UpdateOrderDto,
} from "./dto/order.dto.js";
import { ORDER_CODE_PATTERN, generateOrderCode } from "./order-code.js";
import {
  ORDER_INCLUDE,
  toAdminOrder,
  toListItem,
  toPublicOrder,
  type OrderRow,
} from "./order.mapper.js";
import { buildOrderMessage, whatsappLink } from "./whatsapp.js";

const MAX_CODE_ATTEMPTS = 5;

const ORDER_BY: Record<OrderSort, Prisma.OrderOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }],
  oldest: [{ createdAt: "asc" }],
  "total-desc": [{ total: "desc" }],
};

function mergeLines(
  lines: { productId: string; quantity: number }[],
): Map<string, number> {
  const merged = new Map<string, number>();
  for (const line of lines) {
    merged.set(
      line.productId,
      (merged.get(line.productId) ?? 0) + line.quantity,
    );
  }
  return merged;
}

function phoneFragment(search: string): string | null {
  const digits = search.replace(/\D/g, "");
  if (digits.length < 4) return null;
  return digits.startsWith("0") ? digits.slice(1) : digits;
}

function listWhere(query: OrderListQueryDto): Prisma.OrderWhereInput {
  const search = query.search?.trim();
  const phone = search ? phoneFragment(search) : null;
  return {
    ...(query.status ? { status: query.status } : {}),
    ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
    ...(search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" } },
            { customerName: { contains: search, mode: "insensitive" } },
            ...(phone ? [{ phone: { contains: phone } }] : []),
          ],
        }
      : {}),
  };
}

function emailData(row: OrderRow): OrderEmailData {
  return {
    code: row.code,
    customerName: row.customerName,
    phone: formatNigerianPhone(row.phone),
    email: row.email,
    address: row.address,
    city: row.city,
    state: row.state,
    note: row.note,
    items: row.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
    subtotal: row.subtotal,
    shippingFee: row.shippingFee,
    total: row.total,
    paymentMethod: row.paymentMethod,
  };
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly settings: SettingsService,
    private readonly email: EmailService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async create(dto: CreateOrderDto): Promise<CreateOrderResult> {
    if (dto.paymentMethod === "PAYSTACK") {
      throw new UnprocessableEntityException(
        "Card payments are not available yet",
      );
    }
    const [settings, rates] = await Promise.all([
      this.settings.get(),
      this.settings.listRates(),
    ]);
    const lines = mergeLines(dto.items);
    let row: OrderRow | null = null;
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS && !row; attempt += 1) {
      try {
        row = await this.prisma.$transaction((tx) =>
          this.place(tx, dto, lines, settings, rates),
        );
      } catch (error) {
        if (!isUniqueViolation(error) || attempt === MAX_CODE_ATTEMPTS - 1) {
          throw error;
        }
      }
    }
    if (!row) {
      throw new ConflictException(
        "Could not create the order, please try again",
      );
    }
    const trackingUrl = `${this.env.WEB_URL}/order/${row.code}`;
    void this.notifyCreated(row, settings, trackingUrl);
    return {
      order: toPublicOrder(row, this.storage),
      whatsappUrl: whatsappLink(
        settings.whatsappNumber,
        buildOrderMessage({
          code: row.code,
          customerName: row.customerName,
          items: row.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal: row.subtotal,
          shippingFee: row.shippingFee,
          total: row.total,
          address: row.address,
          city: row.city,
          state: row.state,
          trackingUrl,
        }),
      ),
    };
  }

  async findPublic(code: string): Promise<PublicOrder> {
    const normalised = code.trim().toUpperCase();
    const row = ORDER_CODE_PATTERN.test(normalised)
      ? await this.prisma.order.findUnique({
          where: { code: normalised },
          include: ORDER_INCLUDE,
        })
      : null;
    if (!row) {
      throw new NotFoundException("We could not find that order");
    }
    return toPublicOrder(row, this.storage);
  }

  async list(query: OrderListQueryDto): Promise<Paginated<AdminOrderListItem>> {
    const where = listWhere(query);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: { items: { select: { quantity: true } } },
        orderBy: ORDER_BY[query.sort],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginate(rows.map(toListItem), total, query.page, query.limit);
  }

  async get(id: string): Promise<AdminOrder> {
    const row = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException("Order not found");
    }
    return toAdminOrder(row, this.storage);
  }

  async update(id: string, dto: UpdateOrderDto): Promise<AdminOrder> {
    const { row, shipped } = await this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!current) {
        throw new NotFoundException("Order not found");
      }
      const data: Prisma.OrderUpdateInput = {};
      let shippedNow = false;
      if (dto.status && dto.status !== current.status) {
        if (!ORDER_TRANSITIONS[current.status].includes(dto.status)) {
          throw new UnprocessableEntityException(
            `An order that is ${current.status.toLowerCase().replace(/_/g, " ")} cannot move to ${dto.status.toLowerCase().replace(/_/g, " ")}`,
          );
        }
        data.status = dto.status;
        data.events = { create: { status: dto.status } };
        shippedNow = dto.status === "SHIPPED";
        if (dto.status === "CANCELLED") {
          for (const item of current.items) {
            if (item.productId) {
              await tx.product.updateMany({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
              });
            }
          }
        }
      }
      if (
        dto.paymentStatus !== undefined &&
        dto.paymentStatus !== current.paymentStatus
      ) {
        data.paymentStatus = dto.paymentStatus;
        if (dto.paymentStatus === "PAID") {
          data.paidAt = new Date();
        } else if (dto.paymentStatus === "UNPAID") {
          data.paidAt = null;
        }
      }
      if (dto.courier !== undefined) data.courier = dto.courier;
      if (dto.trackingNumber !== undefined)
        data.trackingNumber = dto.trackingNumber;
      const updated = await tx.order.update({
        where: { id },
        data,
        include: ORDER_INCLUDE,
      });
      return { row: updated, shipped: shippedNow };
    });
    if (shipped && row.email) {
      const settings = await this.settings.get();
      const message = customerShippedEmail(
        emailData(row),
        settings.storeName,
        `${this.env.WEB_URL}/order/${row.code}`,
        row.courier,
        row.trackingNumber,
      );
      void this.email.send({ ...message, to: row.email });
    }
    return toAdminOrder(row, this.storage);
  }

  private async place(
    tx: Prisma.TransactionClient,
    dto: CreateOrderDto,
    lines: Map<string, number>,
    settings: AdminSettings,
    rates: { state: string; fee: number; etaDays: string | null }[],
  ): Promise<OrderRow> {
    const products = await tx.product.findMany({
      where: { id: { in: [...lines.keys()] } },
    });
    const byId = new Map(products.map((product) => [product.id, product]));
    let subtotal = 0;
    const items: Prisma.OrderItemCreateWithoutOrderInput[] = [];
    for (const [productId, quantity] of lines) {
      const product = byId.get(productId);
      if (!product || !product.active) {
        throw new UnprocessableEntityException(
          `${product?.name ?? "A product in your cart"} is no longer available`,
        );
      }
      const claimed = await tx.product.updateMany({
        where: { id: productId, active: true, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });
      if (claimed.count === 0) {
        const fresh = await tx.product.findUnique({
          where: { id: productId },
          select: { stock: true },
        });
        throw new ConflictException(
          fresh && fresh.stock > 0
            ? `Only ${fresh.stock} left of ${product.name}`
            : `${product.name} is out of stock`,
        );
      }
      subtotal += product.price * quantity;
      items.push({
        product: { connect: { id: productId } },
        name: product.name,
        price: product.price,
        quantity,
        image: product.images[0] ?? null,
      });
    }
    const quote = calculateShipping({
      subtotal,
      state: dto.state,
      rates,
      defaultFee: settings.defaultShippingFee,
      freeShippingOver: settings.freeShippingOver,
    });
    return tx.order.create({
      data: {
        code: generateOrderCode(),
        customerName: dto.customerName.trim(),
        phone: dto.phone,
        email: dto.email ?? null,
        address: dto.address.trim(),
        city: dto.city.trim(),
        state: dto.state,
        note: dto.note ?? null,
        subtotal,
        shippingFee: quote.fee,
        total: subtotal + quote.fee,
        paymentMethod: dto.paymentMethod,
        status: "AWAITING_CONFIRMATION",
        items: { create: items },
        events: { create: { status: "AWAITING_CONFIRMATION" } },
      },
      include: ORDER_INCLUDE,
    });
  }

  private async notifyCreated(
    row: OrderRow,
    settings: AdminSettings,
    trackingUrl: string,
  ): Promise<void> {
    const data = emailData(row);
    if (settings.supportEmail) {
      const owner = ownerNewOrderEmail(
        data,
        `${this.env.WEB_URL}/admin/orders/${row.id}`,
      );
      await this.email.send({ ...owner, to: settings.supportEmail });
    }
    if (row.email) {
      const customer = customerConfirmationEmail(
        data,
        settings.storeName,
        trackingUrl,
      );
      await this.email.send({ ...customer, to: row.email });
    }
  }
}
