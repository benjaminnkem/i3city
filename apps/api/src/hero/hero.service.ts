import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  HERO_LIMITS,
  type AdminHeroSlide,
  type HeroTone,
  type PublicHeroSlide,
} from "@repo/types";
import {
  PUBLIC_PRODUCT_INCLUDE,
  toPublicProduct,
} from "../catalog/catalog.mapper.js";
import { isNotFound } from "../common/prisma-errors.js";
import type { HeroSlide } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { StorageService } from "../storage/storage.service.js";
import type { HeroSlideDto, ReorderHeroSlidesDto } from "./dto/hero.dto.js";
import {
  heroSlideStatus,
  isDateKey,
  liveSlideWhere,
  toSchedule,
  toScheduleDates,
} from "./hero-schedule.js";

function tone(value: number | null): HeroTone | null {
  return value === 1 || value === 2 || value === 3 || value === 4
    ? value
    : null;
}

@Injectable()
export class HeroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(now = new Date()): Promise<AdminHeroSlide[]> {
    const rows = await this.prisma.heroSlide.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return this.toAdmin(rows, now);
  }

  async get(id: string): Promise<AdminHeroSlide> {
    const row = await this.prisma.heroSlide.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Slide not found");
    const [slide] = await this.toAdmin([row], new Date());
    if (!slide) throw new NotFoundException("Slide not found");
    return slide;
  }

  async create(dto: HeroSlideDto): Promise<AdminHeroSlide> {
    await this.validate(dto);
    const count = await this.prisma.heroSlide.count();
    if (count >= HERO_LIMITS.slides) {
      throw new UnprocessableEntityException(
        `You can have up to ${HERO_LIMITS.slides} slides. Delete one first.`,
      );
    }
    const last = await this.prisma.heroSlide.aggregate({
      _max: { sortOrder: true },
    });
    const row = await this.prisma.heroSlide.create({
      data: { ...this.data(dto), sortOrder: (last._max.sortOrder ?? -1) + 1 },
    });
    return this.get(row.id);
  }

  async update(id: string, dto: HeroSlideDto): Promise<AdminHeroSlide> {
    await this.validate(dto);
    const existing = await this.prisma.heroSlide.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Slide not found");
    await this.prisma.heroSlide.update({ where: { id }, data: this.data(dto) });
    const nextImage = dto.kind === "IMAGE" ? dto.image : null;
    if (existing.image && existing.image !== nextImage) {
      await this.storage.deleteObjects([existing.image]);
    }
    return this.get(id);
  }

  async reorder(dto: ReorderHeroSlidesDto): Promise<AdminHeroSlide[]> {
    const existing = await this.prisma.heroSlide.findMany({
      select: { id: true },
    });
    const known = new Set(existing.map((slide) => slide.id));
    if (dto.ids.length !== known.size || dto.ids.some((id) => !known.has(id))) {
      throw new BadRequestException("ids must list every slide exactly once");
    }
    await this.prisma.$transaction(
      dto.ids.map((id, index) =>
        this.prisma.heroSlide.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    return this.list();
  }

  async remove(id: string): Promise<void> {
    try {
      const row = await this.prisma.heroSlide.delete({ where: { id } });
      if (row.image) await this.storage.deleteObjects([row.image]);
    } catch (error) {
      if (isNotFound(error)) throw new NotFoundException("Slide not found");
      throw error;
    }
  }

  async listLive(now = new Date()): Promise<PublicHeroSlide[]> {
    const rows = await this.prisma.heroSlide.findMany({
      where: liveSlideWhere(now),
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: rows.flatMap((row) => row.productIds) },
        active: true,
      },
      include: PUBLIC_PRODUCT_INCLUDE,
    });
    const byId = new Map(
      products.map((row) => [row.id, toPublicProduct(row, this.storage)]),
    );
    return rows.flatMap((row): PublicHeroSlide[] => {
      const picked = row.productIds.flatMap((id) => {
        const product = byId.get(id);
        return product ? [product] : [];
      });
      const imageUrl =
        row.kind === "IMAGE" && row.image
          ? this.storage.publicUrl(row.image)
          : null;
      if (row.kind === "PRODUCTS" && picked.length === 0) return [];
      if (row.kind === "IMAGE" && !imageUrl) return [];
      return [
        {
          id: row.id,
          kind: row.kind,
          headline: row.headline,
          subtext: row.subtext,
          ctaLabel: row.ctaLabel,
          ctaHref: row.ctaHref,
          imageUrl,
          imageAlt: row.imageAlt,
          tone: tone(row.tone),
          products: row.kind === "PRODUCTS" ? picked : [],
        },
      ];
    });
  }

  private async validate(dto: HeroSlideDto): Promise<void> {
    for (const key of [dto.startDate, dto.endDate]) {
      if (key && !isDateKey(key)) {
        throw new BadRequestException("Use real calendar dates");
      }
    }
    if (dto.startDate && dto.endDate && dto.endDate < dto.startDate) {
      throw new BadRequestException("The end date must be after the start");
    }
    if (dto.kind === "IMAGE" && !dto.image) {
      throw new BadRequestException("Upload a banner image for this slide");
    }
    if (dto.kind === "PRODUCTS") {
      if (dto.productIds.length === 0) {
        throw new BadRequestException("Pick at least one product");
      }
      const found = await this.prisma.product.count({
        where: { id: { in: dto.productIds } },
      });
      if (found !== dto.productIds.length) {
        throw new BadRequestException("One of the products no longer exists");
      }
    }
  }

  private data(dto: HeroSlideDto) {
    return {
      kind: dto.kind,
      headline: dto.headline,
      subtext: dto.subtext,
      ctaLabel: dto.ctaLabel,
      ctaHref: dto.ctaHref,
      image: dto.kind === "IMAGE" ? dto.image : null,
      imageAlt: dto.kind === "IMAGE" ? dto.imageAlt : "",
      productIds: dto.kind === "PRODUCTS" ? dto.productIds : [],
      tone: dto.tone ?? null,
      active: dto.active,
      ...toSchedule(dto),
    };
  }

  private async toAdmin(
    rows: HeroSlide[],
    now: Date,
  ): Promise<AdminHeroSlide[]> {
    const products = await this.prisma.product.findMany({
      where: { id: { in: rows.flatMap((row) => row.productIds) } },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        images: true,
        active: true,
      },
    });
    const byId = new Map(products.map((product) => [product.id, product]));
    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      headline: row.headline,
      subtext: row.subtext,
      ctaLabel: row.ctaLabel,
      ctaHref: row.ctaHref,
      image: row.image,
      imageUrl: row.image ? this.storage.publicUrl(row.image) : null,
      imageAlt: row.imageAlt,
      productIds: row.productIds,
      products: row.productIds.flatMap((id) => {
        const product = byId.get(id);
        if (!product) return [];
        const [first] = product.images;
        return [
          {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            imageUrl: first ? this.storage.publicUrl(first) : null,
            active: product.active,
          },
        ];
      }),
      tone: tone(row.tone),
      active: row.active,
      ...toScheduleDates(row),
      status: heroSlideStatus(row, now),
      sortOrder: row.sortOrder,
    }));
  }
}
