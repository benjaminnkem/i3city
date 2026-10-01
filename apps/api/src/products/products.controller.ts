import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { AdminProduct } from "@repo/types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import type { Paginated } from "../common/paginated.js";
import {
  BulkIdsDto,
  BulkStatusDto,
  CreateProductDto,
  ProductListQueryDto,
  UpdateProductDto,
} from "./dto/product.dto.js";
import { ProductsService } from "./products.service.js";

@Controller("admin/products")
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query() query: ProductListQueryDto): Promise<Paginated<AdminProduct>> {
    return this.products.list(query);
  }

  @Post()
  create(@Body() dto: CreateProductDto): Promise<AdminProduct> {
    return this.products.create(dto);
  }

  @Post("status")
  @HttpCode(HttpStatus.OK)
  setStatus(@Body() dto: BulkStatusDto): Promise<{ updated: number }> {
    return this.products.setStatus(dto);
  }

  @Post("delete")
  @HttpCode(HttpStatus.OK)
  removeMany(@Body() dto: BulkIdsDto): Promise<{ deleted: number }> {
    return this.products.removeMany(dto);
  }

  @Get(":id")
  get(@Param("id") id: string): Promise<AdminProduct> {
    return this.products.get(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<AdminProduct> {
    return this.products.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string): Promise<void> {
    return this.products.remove(id);
  }
}
