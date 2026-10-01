import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { AdminOrder, AdminOrderListItem } from "@repo/types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import type { Paginated } from "../common/paginated.js";
import { OrderListQueryDto, UpdateOrderDto } from "./dto/order.dto.js";
import { OrdersService } from "./orders.service.js";

@Controller("admin/orders")
@UseGuards(JwtAuthGuard)
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(
    @Query() query: OrderListQueryDto,
  ): Promise<Paginated<AdminOrderListItem>> {
    return this.orders.list(query);
  }

  @Get(":id")
  get(@Param("id") id: string): Promise<AdminOrder> {
    return this.orders.get(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateOrderDto,
  ): Promise<AdminOrder> {
    return this.orders.update(id, dto);
  }
}
