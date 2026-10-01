import { PartialType } from "@nestjs/mapped-types";
import {
  IMAGE_KEY_PATTERN,
  MAX_PRODUCT_IMAGES,
  PRODUCT_SORTS,
  PRODUCT_STATUS_FILTERS,
  STOCK_FILTERS,
  type ProductSort,
  type ProductStatusFilter,
  type StockFilter,
} from "@repo/types";
import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { PageQueryDto } from "../../common/page-query.dto.js";

const MAX_PRICE = 100_000_000;
const MAX_STOCK = 100_000;
const MAX_BULK_IDS = 200;

function toBoolean({ value }: { value: unknown }): unknown {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return value;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsInt()
  @Min(1)
  @Max(MAX_PRICE)
  price!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_PRICE)
  compareAtPrice?: number | null;

  @IsInt()
  @Min(0)
  @Max(MAX_STOCK)
  stock!: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  sku?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_PRODUCT_IMAGES)
  @ArrayUnique()
  @Matches(IMAGE_KEY_PATTERN, { each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  categoryId?: string | null;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class BulkStatusDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_BULK_IDS)
  @ArrayUnique()
  @IsString({ each: true })
  ids!: string[];

  @IsBoolean()
  active!: boolean;
}

export class ProductListQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsIn(PRODUCT_STATUS_FILTERS)
  status?: ProductStatusFilter;

  @IsOptional()
  @IsIn(STOCK_FILTERS)
  stock?: StockFilter;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsIn(PRODUCT_SORTS)
  sort: ProductSort = "newest";
}
