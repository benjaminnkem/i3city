import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import type {
  PublicCategory,
  PublicProduct,
  PublicProductDetail,
  PublicSettings,
  ValidatedCartLine,
} from "@repo/types";
import type { Paginated } from "../common/paginated.js";
import { CatalogService } from "./catalog.service.js";
import { ShopQueryDto, ValidateCartDto } from "./dto/catalog.dto.js";

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("products")
  products(@Query() query: ShopQueryDto): Promise<Paginated<PublicProduct>> {
    return this.catalog.listProducts(query);
  }

  @Get("products/:slug")
  product(@Param("slug") slug: string): Promise<PublicProductDetail> {
    return this.catalog.getProduct(slug);
  }

  @Get("categories")
  categories(): Promise<PublicCategory[]> {
    return this.catalog.listCategories();
  }

  @Get("settings/public")
  settings(): Promise<PublicSettings> {
    return this.catalog.publicSettings();
  }

  @Post("cart/validate")
  @HttpCode(HttpStatus.OK)
  validateCart(@Body() dto: ValidateCartDto): Promise<ValidatedCartLine[]> {
    return this.catalog.validateCart(dto.items);
  }
}
