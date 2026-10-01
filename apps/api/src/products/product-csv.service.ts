import { Injectable } from "@nestjs/common";
import {
  PRODUCT_CSV_COLUMNS,
  type ImportResult,
  type ImportRowResult,
} from "@repo/types";
import { toCsv } from "../common/csv.js";
import { uniqueSlug } from "../common/slug.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { ImportProductsDto } from "./dto/product.dto.js";
import {
  importRowSchema,
  type ParsedImportRow,
} from "./product-import.schema.js";

interface ValidRow {
  line: number;
  data: ParsedImportRow;
}

@Injectable()
export class ProductCsvService {
  constructor(private readonly prisma: PrismaService) {}

  async exportCsv(): Promise<string> {
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: "asc" },
      include: { category: { select: { name: true } } },
    });
    return toCsv(
      PRODUCT_CSV_COLUMNS,
      products.map((product) => [
        product.sku ?? "",
        product.name,
        product.brand ?? "",
        product.category?.name ?? "",
        String(product.price),
        product.compareAtPrice ? String(product.compareAtPrice) : "",
        String(product.stock),
        product.active ? "true" : "false",
        product.featured ? "true" : "false",
        product.description,
      ]),
    );
  }

  async import(dto: ImportProductsDto): Promise<ImportResult> {
    const { valid, errors } = this.validate(dto.rows);
    const skus = valid.flatMap((row) => (row.data.sku ? [row.data.sku] : []));
    const existing = await this.prisma.product.findMany({
      where: { sku: { in: skus } },
      select: { id: true, sku: true, price: true, compareAtPrice: true },
    });
    const bySku = new Map(
      existing.flatMap((item) => (item.sku ? [[item.sku, item]] : [])),
    );
    const categories = await this.prisma.category.findMany({
      select: { id: true, name: true },
    });
    const categoryIds = new Map(
      categories.map((category) => [category.name.toLowerCase(), category.id]),
    );
    const newCategoryNames = new Map<string, string>();
    for (const row of valid) {
      const name = row.data.category;
      if (name && !categoryIds.has(name.toLowerCase())) {
        newCategoryNames.set(name.toLowerCase(), name);
      }
    }

    const results: ImportRowResult[] = [...errors];
    const plans: { row: ValidRow; existingId: string | null }[] = [];
    for (const row of valid) {
      const match = row.data.sku ? bySku.get(row.data.sku) : undefined;
      const compare =
        row.data.compare_at_price ?? match?.compareAtPrice ?? undefined;
      const price = row.data.price;
      if (
        compare !== undefined &&
        row.data.compare_at_price !== undefined &&
        compare <= price
      ) {
        results.push({
          line: row.line,
          action: "error",
          name: row.data.name,
          sku: row.data.sku ?? null,
          messages: ["Compare-at price must be higher than the price"],
        });
        continue;
      }
      plans.push({ row, existingId: match?.id ?? null });
      results.push({
        line: row.line,
        action: match ? "update" : "create",
        name: row.data.name,
        sku: row.data.sku ?? null,
        messages: [],
      });
    }
    results.sort((a, b) => a.line - b.line);

    const summary = {
      create: results.filter((row) => row.action === "create").length,
      update: results.filter((row) => row.action === "update").length,
      error: results.filter((row) => row.action === "error").length,
    };
    const createdCategories = [...newCategoryNames.values()];

    if (!dto.dryRun) {
      await this.apply(plans, newCategoryNames, categoryIds);
    }
    return { dryRun: dto.dryRun, summary, createdCategories, rows: results };
  }

  private validate(rows: Record<string, string>[]): {
    valid: ValidRow[];
    errors: ImportRowResult[];
  } {
    const valid: ValidRow[] = [];
    const errors: ImportRowResult[] = [];
    const seenSkus = new Set<string>();
    rows.forEach((raw, index) => {
      const line = index + 2;
      const parsed = importRowSchema.safeParse({
        name: raw.name ?? "",
        sku: raw.sku ?? "",
        brand: raw.brand ?? "",
        category: raw.category ?? "",
        price: raw.price ?? "",
        compare_at_price: raw.compare_at_price ?? "",
        stock: raw.stock ?? "",
        active: raw.active ?? "",
        featured: raw.featured ?? "",
        description: raw.description ?? "",
      });
      const messages = parsed.success
        ? []
        : parsed.error.issues.map(
            (issue) => `${issue.path.join(".")}: ${issue.message}`,
          );
      if (parsed.success && parsed.data.sku) {
        if (seenSkus.has(parsed.data.sku)) {
          messages.push("sku: appears more than once in this file");
        }
        seenSkus.add(parsed.data.sku);
      }
      if (parsed.success && messages.length === 0) {
        valid.push({ line, data: parsed.data });
      } else {
        errors.push({
          line,
          action: "error",
          name: raw.name ?? "",
          sku: raw.sku || null,
          messages,
        });
      }
    });
    return { valid, errors };
  }

  private async apply(
    plans: { row: ValidRow; existingId: string | null }[],
    newCategoryNames: Map<string, string>,
    categoryIds: Map<string, string>,
  ): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        const last = await tx.category.aggregate({ _max: { sortOrder: true } });
        let order = (last._max.sortOrder ?? -1) + 1;
        for (const [key, name] of newCategoryNames) {
          const slug = await uniqueSlug(
            name,
            async (candidate) =>
              (await tx.category.count({ where: { slug: candidate } })) > 0,
          );
          const created = await tx.category.create({
            data: { name, slug, sortOrder: order },
          });
          order += 1;
          categoryIds.set(key, created.id);
        }
        for (const { row, existingId } of plans) {
          const { data } = row;
          const categoryId = data.category
            ? (categoryIds.get(data.category.toLowerCase()) ?? null)
            : undefined;
          if (existingId) {
            await tx.product.update({
              where: { id: existingId },
              data: {
                name: data.name,
                price: data.price,
                ...(data.brand !== undefined ? { brand: data.brand } : {}),
                ...(data.description !== undefined
                  ? { description: data.description }
                  : {}),
                ...(data.compare_at_price !== undefined
                  ? { compareAtPrice: data.compare_at_price }
                  : {}),
                ...(data.stock !== undefined ? { stock: data.stock } : {}),
                ...(data.active !== undefined ? { active: data.active } : {}),
                ...(data.featured !== undefined
                  ? { featured: data.featured }
                  : {}),
                ...(categoryId !== undefined ? { categoryId } : {}),
              },
            });
          } else {
            const slug = await uniqueSlug(
              data.name,
              async (candidate) =>
                (await tx.product.count({ where: { slug: candidate } })) > 0,
            );
            await tx.product.create({
              data: {
                name: data.name,
                slug,
                sku: data.sku ?? null,
                brand: data.brand ?? null,
                description: data.description ?? "",
                price: data.price,
                compareAtPrice: data.compare_at_price ?? null,
                stock: data.stock ?? 0,
                active: data.active ?? true,
                featured: data.featured ?? false,
                categoryId: categoryId ?? null,
              },
            });
          }
        }
      },
      { timeout: 60_000 },
    );
  }
}
