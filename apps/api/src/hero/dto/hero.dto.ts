import {
  DATE_KEY_PATTERN,
  HERO_CTA_HREF_PATTERN,
  HERO_LIMITS,
  HERO_SLIDE_KINDS,
  HERO_TONES,
  IMAGE_KEY_PATTERN,
  type HeroSlideKind,
  type HeroTone,
} from "@repo/types";
import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";

function trim({ value }: { value: unknown }): unknown {
  return typeof value === "string" ? value.trim() : value;
}

function blankToNull({ value }: { value: unknown }): unknown {
  return typeof value === "string" && value.trim() === "" ? null : value;
}

export class HeroSlideDto {
  @IsIn(HERO_SLIDE_KINDS)
  kind!: HeroSlideKind;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(HERO_LIMITS.headline)
  headline!: string;

  @Transform(trim)
  @IsString()
  @MaxLength(HERO_LIMITS.subtext)
  subtext!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(HERO_LIMITS.ctaLabel)
  ctaLabel!: string;

  @Transform(trim)
  @IsString()
  @MaxLength(HERO_LIMITS.ctaHref)
  @Matches(HERO_CTA_HREF_PATTERN, {
    message: "ctaHref must be a path on this site or whatsapp",
  })
  ctaHref!: string;

  @Transform(blankToNull)
  @IsOptional()
  @Matches(IMAGE_KEY_PATTERN)
  image!: string | null;

  @Transform(trim)
  @IsString()
  @MaxLength(HERO_LIMITS.imageAlt)
  imageAlt!: string;

  @IsArray()
  @ArrayMaxSize(HERO_LIMITS.products)
  @ArrayUnique()
  @IsString({ each: true })
  productIds!: string[];

  @IsOptional()
  @IsIn(HERO_TONES)
  tone!: HeroTone | null;

  @IsBoolean()
  active!: boolean;

  @Transform(blankToNull)
  @IsOptional()
  @Matches(DATE_KEY_PATTERN)
  startDate!: string | null;

  @Transform(blankToNull)
  @IsOptional()
  @Matches(DATE_KEY_PATTERN)
  endDate!: string | null;
}

export class ReorderHeroSlidesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  ids!: string[];
}
