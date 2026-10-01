import { Injectable } from "@nestjs/common";
import {
  LOW_STOCK_THRESHOLD,
  ORDER_STATUSES,
  type AdminStats,
  type CategoryShare,
  type OrderStatusName,
  type RevenuePoint,
} from "@repo/types";
import { PrismaService } from "../prisma/prisma.service.js";
import { StorageService } from "../storage/storage.service.js";
import { topProducts } from "./top-products.js";
import { lagosDayKey, lagosDayStart, lastDayKeys } from "./lagos-time.js";

const WINDOW_DAYS = 60;
const SERIES_DAYS = 30;
const TOP_PRODUCT_COUNT = 5;
const LOW_STOCK_LIMIT = 8;

function sumRevenue(points: RevenuePoint[]): number {
  return points.reduce((total, point) => total + point.revenue, 0);
}

function sumOrders(points: RevenuePoint[]): number {
  return points.reduce((total, point) => total + point.orders, 0);
}

@Injectable()
export class StatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async overview(now = new Date()): Promise<AdminStats> {
    const keys = lastDayKeys(WINDOW_DAYS, now);
    const windowStart = lagosDayStart(keys[0] ?? lagosDayKey(now));
    const seriesStart = lagosDayStart(keys[WINDOW_DAYS - SERIES_DAYS] ?? "");
    const todayStart = lagosDayStart(lagosDayKey(now));

    const [
      paidOrders,
      ordersToday,
      awaitingAction,
      statusGroups,
      items,
      productCounts,
      inventory,
      categoryRows,
      uncategorised,
      lowStockRows,
    ] = await Promise.all([
      this.prisma.order.findMany({
        where: { paymentStatus: "PAID", paidAt: { gte: windowStart } },
        select: { paidAt: true, total: true },
      }),
      this.prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.order.count({ where: { status: "AWAITING_CONFIRMATION" } }),
      this.prisma.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: seriesStart } },
        _count: { _all: true },
      }),
      this.prisma.orderItem.findMany({
        where: {
          order: { paymentStatus: "PAID", paidAt: { gte: seriesStart } },
        },
        select: { name: true, price: true, quantity: true },
      }),
      this.productCounts(),
      this.prisma.$queryRaw<{ value: bigint }[]>`
        SELECT COALESCE(SUM("price" * "stock"), 0)::bigint AS value FROM "Product"
      `,
      this.prisma.category.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { name: true, _count: { select: { products: true } } },
      }),
      this.prisma.product.count({ where: { categoryId: null } }),
      this.prisma.product.findMany({
        where: { active: true, stock: { lte: LOW_STOCK_THRESHOLD } },
        orderBy: [{ stock: "asc" }, { name: "asc" }],
        take: LOW_STOCK_LIMIT,
        select: { id: true, name: true, stock: true, images: true },
      }),
    ]);

    const byDay = new Map<string, RevenuePoint>(
      keys.map((date) => [date, { date, revenue: 0, orders: 0 }]),
    );
    for (const order of paidOrders) {
      const point = order.paidAt
        ? byDay.get(lagosDayKey(order.paidAt))
        : undefined;
      if (point) {
        point.revenue += order.total;
        point.orders += 1;
      }
    }
    const days = keys.flatMap((key) => byDay.get(key) ?? []);
    const last30 = days.slice(-SERIES_DAYS);
    const prev30 = days.slice(0, WINDOW_DAYS - SERIES_DAYS);
    const last7 = days.slice(-7);
    const prev7 = days.slice(-14, -7);
    const paidCount30d = sumOrders(last30);

    return {
      generatedAt: now.toISOString(),
      orders: {
        today: ordersToday,
        awaitingAction,
        revenue7d: sumRevenue(last7),
        revenuePrev7d: sumRevenue(prev7),
        revenue30d: sumRevenue(last30),
        revenuePrev30d: sumRevenue(prev30),
        paidCount30d,
        averageOrderValue30d:
          paidCount30d === 0
            ? 0
            : Math.round(sumRevenue(last30) / paidCount30d),
      },
      products: {
        ...productCounts,
        inventoryValue: Number(inventory[0]?.value ?? 0),
      },
      revenueSeries: last30,
      orderStatus: ORDER_STATUSES.flatMap((status) => {
        const group = statusGroups.find((entry) => entry.status === status);
        return group
          ? [{ status: status as OrderStatusName, count: group._count._all }]
          : [];
      }),
      topProducts: topProducts(items, TOP_PRODUCT_COUNT),
      categories: this.categoryShares(categoryRows, uncategorised),
      lowStock: lowStockRows.map((row) => ({
        id: row.id,
        name: row.name,
        stock: row.stock,
        imageUrl: row.images[0] ? this.storage.publicUrl(row.images[0]) : null,
      })),
    };
  }

  private async productCounts() {
    const [total, active, featured, lowStock, outOfStock] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { active: true } }),
      this.prisma.product.count({ where: { featured: true } }),
      this.prisma.product.count({
        where: { stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } },
      }),
      this.prisma.product.count({ where: { stock: 0 } }),
    ]);
    return {
      total,
      active,
      inactive: total - active,
      featured,
      lowStock,
      outOfStock,
    };
  }

  private categoryShares(
    rows: { name: string; _count: { products: number } }[],
    uncategorised: number,
  ): CategoryShare[] {
    const shares = rows.map((row) => ({
      name: row.name,
      productCount: row._count.products,
    }));
    return uncategorised > 0
      ? [...shares, { name: "Uncategorised", productCount: uncategorised }]
      : shares;
  }
}
