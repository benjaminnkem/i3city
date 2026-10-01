import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  PublicCategory,
  PublicProduct,
  PublicProductDetail,
  PublicSettings,
  ShopSort,
  ValidatedCartLine,
} from "@repo/types";
import { paginate, type Paginated } from "../common/paginated.js";
import type { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { SettingsService } from "../settings/settings.service.js";
import { StorageService } from "../storage/storage.service.js";
import { PUBLIC_PRODUCT_INCLUDE, toPublicProduct } from "./catalog.mapper.js";
import type { CartLineDto, ShopQueryDto } from "./dto/catalog.dto.js";

const RELATED_LIMIT = 4;

const ORDER_BY: Record<ShopSort, Prisma.ProductOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }],
  "price-asc": [{ price: "asc" }, { name: "asc" }],
  "price-desc": [{ price: "desc" }, { name: "asc" }],
};

function shopWhere(query: ShopQueryDto): Prisma.ProductWhereInput {
  const search = query.search?.trim();
  const price: Prisma.IntFilter = {
    ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
    ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
  };
  return {
    active: true,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(Object.keys(price).length > 0 ? { price } : {}),
    ...(query.inStock ? { stock: { gt: 0 } } : {}),
    ...(query.featured !== undefined ? { featured: query.featured } : {}),
  };
}

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly settings: SettingsService,
  ) {}

  async listProducts(query: ShopQueryDto): Promise<Paginated<PublicProduct>> {
    const where = shopWhere(query);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: PUBLIC_PRODUCT_INCLUDE,
        orderBy: ORDER_BY[query.sort],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    return paginate(
      rows.map((row) => toPublicProduct(row, this.storage)),
      total,
      query.page,
      query.limit,
    );
  }

  async getProduct(slug: string): Promise<PublicProductDetail> {
    const row = await this.prisma.product.findFirst({
      where: { slug, active: true },
      include: PUBLIC_PRODUCT_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException("Product not found");
    }
    const related = await this.prisma.product.findMany({
      where: {
        active: true,
        id: { not: row.id },
        ...(row.categoryId ? { categoryId: row.categoryId } : {}),
      },
      include: PUBLIC_PRODUCT_INCLUDE,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: RELATED_LIMIT,
    });
    return {
      ...toPublicProduct(row, this.storage),
      description: row.description,
      related: related.map((item) => toPublicProduct(item, this.storage)),
    };
  }

  async listCategories(): Promise<PublicCategory[]> {
    const rows = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: { where: { active: true } } } },
      },
    });
    return rows
      .filter((row) => row._count.products > 0)
      .map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        productCount: row._count.products,
      }));
  }

  async publicSettings(): Promise<PublicSettings> {
    const [settings, rates] = await Promise.all([
      this.settings.get(),
      this.settings.listRates(),
    ]);
    return {
      storeName: settings.storeName,
      whatsappNumber: settings.whatsappNumber,
      supportEmail: settings.supportEmail,
      address: settings.address,
      openingHours: settings.openingHours,
      defaultShippingFee: settings.defaultShippingFee,
      freeShippingOver: settings.freeShippingOver,
      paymentMethods: settings.paystackEnabled
        ? ["WHATSAPP", "PAYSTACK"]
        : ["WHATSAPP"],
      shippingRates: rates,
    };
  }

  async validateCart(lines: CartLineDto[]): Promise<ValidatedCartLine[]> {
    const rows = await this.prisma.product.findMany({
      where: { id: { in: lines.map((line) => line.productId) } },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    return lines.map((line) => {
      const row = byId.get(line.productId);
      if (!row) {
        return {
          productId: line.productId,
          name: "Unavailable product",
          slug: "",
          price: line.price ?? 0,
          imageUrl: null,
          stock: 0,
          quantity: 0,
          unavailable: true,
          priceChanged: false,
          quantityAdjusted: false,
        };
      }
      const unavailable = !row.active || row.stock === 0;
      const quantity = unavailable ? 0 : Math.min(line.quantity, row.stock);
      return {
        productId: row.id,
        name: row.name,
        slug: row.slug,
        price: row.price,
        imageUrl: row.images[0] ? this.storage.publicUrl(row.images[0]) : null,
        stock: row.stock,
        quantity,
        unavailable,
        priceChanged: line.price !== undefined && line.price !== row.price,
        quantityAdjusted: !unavailable && quantity !== line.quantity,
      };
    });
  }
}
