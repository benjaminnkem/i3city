import {
  NIGERIA_STATES,
  ORDER_SORTS,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  normaliseNigerianPhone,
  type OrderSort,
  type OrderStatusName,
  type PaymentMethodName,
  type PaymentStatusName,
} from "@repo/types";
import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
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
  MinLength,
  ValidateNested,
} from "class-validator";
import { PageQueryDto } from "../../common/page-query.dto.js";

const MAX_LINES = 50;
const MAX_QUANTITY = 99;

function blankToNull({ value }: { value: unknown }): unknown {
  return typeof value === "string" && value.trim() === "" ? null : value;
}

function toInternationalPhone({ value }: { value: unknown }): unknown {
  return typeof value === "string"
    ? (normaliseNigerianPhone(value) ?? value)
    : value;
}

export class OrderLineDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_QUANTITY)
  quantity!: number;
}

export class CreateOrderDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  customerName!: string;

  @Transform(toInternationalPhone)
  @Matches(/^234[789][01]\d{8}$/, {
    message: "Enter a valid Nigerian phone number",
  })
  phone!: string;

  @Transform(blankToNull)
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string | null;

  @IsString()
  @MinLength(5)
  @MaxLength(300)
  address!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city!: string;

  @IsIn(NIGERIA_STATES)
  state!: string;

  @Transform(blankToNull)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;

  @IsIn(PAYMENT_METHODS)
  paymentMethod!: PaymentMethodName;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_LINES)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items!: OrderLineDto[];
}

export class OrderListQueryDto extends PageQueryDto {
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatusName;

  @IsOptional()
  @IsIn(PAYMENT_STATUSES)
  paymentStatus?: PaymentStatusName;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(ORDER_SORTS)
  sort: OrderSort = "newest";
}

export class UpdateOrderDto {
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatusName;

  @IsOptional()
  @IsIn(PAYMENT_STATUSES)
  paymentStatus?: PaymentStatusName;

  @Transform(blankToNull)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  courier?: string | null;

  @Transform(blankToNull)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  trackingNumber?: string | null;
}
