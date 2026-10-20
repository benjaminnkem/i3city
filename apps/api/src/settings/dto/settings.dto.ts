import {
  ANNOUNCEMENT_MAX_LENGTH,
  ANNOUNCEMENT_MAX_MESSAGES,
  NIGERIA_STATES,
  normaliseNigerianPhone,
} from "@repo/types";
import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

const MAX_FEE = 1_000_000;

function blankToNull({ value }: { value: unknown }): unknown {
  return typeof value === "string" && value.trim() === "" ? null : value;
}

function trimEach({ value }: { value: unknown }): unknown {
  return Array.isArray(value)
    ? value.map((item: unknown) =>
        typeof item === "string" ? item.trim() : item,
      )
    : value;
}

function toInternationalPhone({ value }: { value: unknown }): unknown {
  return typeof value === "string"
    ? (normaliseNigerianPhone(value) ?? value)
    : value;
}

export class UpdateSettingsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  storeName!: string;

  @Transform(toInternationalPhone)
  @Matches(/^234[789][01]\d{8}$/, {
    message: "Enter a valid Nigerian WhatsApp number",
  })
  whatsappNumber!: string;

  @Transform(blankToNull)
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  supportEmail?: string | null;

  @Transform(blankToNull)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string | null;

  @Transform(blankToNull)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  openingHours?: string | null;

  @Transform(blankToNull)
  @IsOptional()
  @IsString()
  @MaxLength(600)
  bankDetails?: string | null;

  @IsInt()
  @Min(0)
  @Max(MAX_FEE)
  defaultShippingFee!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  freeShippingOver?: number | null;

  @IsOptional()
  @IsBoolean()
  paystackEnabled?: boolean;
}

export class ShippingRateDto {
  @IsIn(NIGERIA_STATES)
  state!: string;

  @IsInt()
  @Min(0)
  @Max(MAX_FEE)
  fee!: number;

  @Transform(blankToNull)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  etaDays?: string | null;
}

export class UpdateShippingRatesDto {
  @IsArray()
  @ArrayMaxSize(NIGERIA_STATES.length)
  @ArrayUnique((rate: ShippingRateDto) => rate.state)
  @ValidateNested({ each: true })
  @Type(() => ShippingRateDto)
  rates!: ShippingRateDto[];
}

export class UpdateAnnouncementsDto {
  @IsBoolean()
  enabled!: boolean;

  @Transform(trimEach)
  @IsArray()
  @ArrayMaxSize(ANNOUNCEMENT_MAX_MESSAGES)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(ANNOUNCEMENT_MAX_LENGTH, { each: true })
  messages!: string[];
}
