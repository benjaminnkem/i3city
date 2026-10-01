import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  LOW_STOCK_THRESHOLD,
  type AdminProduct,
  type ProductSort,
} from "@repo/types";
import { isNotFound, isUniqueViolation } from "../common/prisma-errors.js";
import { paginate, type Paginated } from "../common/paginated.js";
import { uniqueSlug } from "../common/slug.js";
import type { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { StorageService } from "../storage/storage.service.js";
import type {
  BulkIdsDto,
  BulkStatusDto,
  CreateProductDto,
  ProductListQueryDto,
  UpdateProductDto,
} from "./dto/product.dto.js";
import { PRODUCT_INCLUDE, toAdminProduct } from "./product.mapper.js";

const ORDER_BY: Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]> =
  {
    newest: [{ createdAt: "desc" }],
    name: [{ name: "asc" }],
    "price-asc": [{ price: "asc" }, { name: "asc" }],
    "price-desc": [{ price: "desc" }, { name: "asc" }],
    "stock-asc": [{ stock: "asc" }, { name: "asc" }],
  };

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function assertComparePrice(
  price: number,
  compareAtPrice: number | null,
): void {
  if (compareAtPrice !== null && compareAtPrice <= price) {
    throw new UnprocessableEntityException(
      "Compare-at price must be higher than the price",
    );
  }
}

function stockWhere(
  stock: ProductListQueryDto["stock"],
): Prisma.ProductWhereInput {
  switch (stock) {
    case "in":
      return { stock: { gt: 0 } };
    case "low":
      return { stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } };
    case "out":
      return { stock: 0 };
    default:
      return {};
  }
}

function listWhere(query: ProductListQueryDto): Prisma.ProductWhereInput {
  const search = query.search?.trim();
  return {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(query.categoryId
      ? { categoryId: query.categoryId === "none" ? null : query.categoryId }
      : {}),
    ...(query.status ? { active: query.status === "active" } : {}),
    ...(query.featured !== undefined ? { featured: query.featured } : {}),
    ...stockWhere(query.stock),
  };
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(query: ProductListQueryDto): Promise<Paginated<AdminProduct>> {
    const where = listWhere(query);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: ORDER_BY[query.sort],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    return paginate(
      rows.map((row) => toAdminProduct(row, this.storage)),
      total,
      query.page,
      query.limit,
    );
  }

  async get(id: string): Promise<AdminProduct> {
    const row = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException("Product not found");
    }
    return toAdminProduct(row, this.storage);
  }

  async create(dto: CreateProductDto): Promise<AdminProduct> {
    const compareAtPrice = dto.compareAtPrice ?? null;
    assertComparePrice(dto.price, compareAtPrice);
    await this.assertCategory(dto.categoryId);
    const slug = await uniqueSlug(
      dto.name,
      async (candidate) =>
        (await this.prisma.product.count({ where: { slug: candidate } })) > 0,
    );
    try {
      const row = await this.prisma.product.create({
        data: {
          name: dto.name.trim(),
          slug,
          description: dto.description ?? "",
          price: dto.price,
          compareAtPrice,
          stock: dto.stock,
          sku: emptyToNull(dto.sku),
          brand: emptyToNull(dto.brand),
          images: dto.images ?? [],
          featured: dto.featured ?? false,
          active: dto.active ?? true,
          categoryId: dto.categoryId ?? null,
        },
        include: PRODUCT_INCLUDE,
      });
      return toAdminProduct(row, this.storage);
    } catch (error) {
      throw this.translate(error);
    }
  }

  async update(id: string, dto: UpdateProductDto): Promise<AdminProduct> {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Product not found");
    }
    const price = dto.price ?? existing.price;
    const compareAtPrice =
      dto.compareAtPrice === undefined
        ? existing.compareAtPrice
        : dto.compareAtPrice;
    assertComparePrice(price, compareAtPrice);
    if (dto.categoryId !== undefined) {
      await this.assertCategory(dto.categoryId);
    }
    try {
      const row = await this.prisma.product.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.price !== undefined ? { price: dto.price } : {}),
          compareAtPrice,
          ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
          ...(dto.sku !== undefined ? { sku: emptyToNull(dto.sku) } : {}),
          ...(dto.brand !== undefined ? { brand: emptyToNull(dto.brand) } : {}),
          ...(dto.images !== undefined ? { images: dto.images } : {}),
          ...(dto.featured !== undefined ? { featured: dto.featured } : {}),
          ...(dto.active !== undefined ? { active: dto.active } : {}),
          ...(dto.categoryId !== undefined
            ? { categoryId: dto.categoryId }
            : {}),
        },
        include: PRODUCT_INCLUDE,
      });
      if (dto.images !== undefined) {
        const kept = new Set(dto.images);
        await this.storage.deleteObjects(
          existing.images.filter((key) => !kept.has(key)),
        );
      }
      return toAdminProduct(row, this.storage);
    } catch (error) {
      throw this.translate(error);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const removed = await this.prisma.product.delete({ where: { id } });
      await this.storage.deleteObjects(removed.images);
    } catch (error) {
      throw this.translate(error);
    }
  }

  async removeMany(dto: BulkIdsDto): Promise<{ deleted: number }> {
    const rows = await this.prisma.product.findMany({
      where: { id: { in: dto.ids } },
      select: { id: true, images: true },
    });
    const result = await this.prisma.product.deleteMany({
      where: { id: { in: rows.map((row) => row.id) } },
    });
    await this.storage.deleteObjects(rows.flatMap((row) => row.images));
    return { deleted: result.count };
  }

  async setStatus(dto: BulkStatusDto): Promise<{ updated: number }> {
    const result = await this.prisma.product.updateMany({
      where: { id: { in: dto.ids } },
      data: { active: dto.active },
    });
    return { updated: result.count };
  }

  private async assertCategory(
    categoryId: string | null | undefined,
  ): Promise<void> {
    if (!categoryId) {
      return;
    }
    const count = await this.prisma.category.count({
      where: { id: categoryId },
    });
    if (count === 0) {
      throw new BadRequestException("Category does not exist");
    }
  }

  private translate(error: unknown): unknown {
    if (isNotFound(error)) {
      return new NotFoundException("Product not found");
    }
    if (isUniqueViolation(error)) {
      return new ConflictException("SKU is already used by another product");
    }
    return error;
  }
}
