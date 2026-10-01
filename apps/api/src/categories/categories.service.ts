import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AdminCategory } from "@repo/types";
import { isNotFound, isUniqueViolation } from "../common/prisma-errors.js";
import { uniqueSlug } from "../common/slug.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type {
  CreateCategoryDto,
  ReorderCategoriesDto,
  UpdateCategoryDto,
} from "./dto/category.dto.js";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  _count: { products: number };
}

function toAdminCategory(row: CategoryRow): AdminCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sortOrder,
    productCount: row._count.products,
  };
}

const WITH_COUNT = { _count: { select: { products: true } } } as const;

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<AdminCategory[]> {
    const rows = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: WITH_COUNT,
    });
    return rows.map(toAdminCategory);
  }

  async create(dto: CreateCategoryDto): Promise<AdminCategory> {
    const slug = await uniqueSlug(
      dto.name,
      async (candidate) =>
        (await this.prisma.category.count({ where: { slug: candidate } })) > 0,
    );
    const last = await this.prisma.category.aggregate({
      _max: { sortOrder: true },
    });
    const row = await this.prisma.category.create({
      data: {
        name: dto.name.trim(),
        slug,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
      },
      include: WITH_COUNT,
    });
    return toAdminCategory(row);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<AdminCategory> {
    try {
      const row = await this.prisma.category.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        },
        include: WITH_COUNT,
      });
      return toAdminCategory(row);
    } catch (error) {
      if (isNotFound(error)) {
        throw new NotFoundException("Category not found");
      }
      if (isUniqueViolation(error)) {
        throw new ConflictException("Another category already uses this slug");
      }
      throw error;
    }
  }

  async reorder(dto: ReorderCategoriesDto): Promise<AdminCategory[]> {
    const existing = await this.prisma.category.findMany({
      select: { id: true },
    });
    const known = new Set(existing.map((category) => category.id));
    if (dto.ids.length !== known.size || dto.ids.some((id) => !known.has(id))) {
      throw new BadRequestException(
        "ids must list every category exactly once",
      );
    }
    await this.prisma.$transaction(
      dto.ids.map((id, index) =>
        this.prisma.category.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    return this.list();
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.category.delete({ where: { id } });
    } catch (error) {
      if (isNotFound(error)) {
        throw new NotFoundException("Category not found");
      }
      throw error;
    }
  }
}
