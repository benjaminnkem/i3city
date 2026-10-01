import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { CreateOrderResult, PublicOrder } from "@repo/types";
import { CreateOrderDto } from "./dto/order.dto.js";
import { OrdersService } from "./orders.service.js";

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(@Body() dto: CreateOrderDto): Promise<CreateOrderResult> {
    return this.orders.create(dto);
  }

  @Get(":code")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  track(@Param("code") code: string): Promise<PublicOrder> {
    return this.orders.findPublic(code);
  }
}
