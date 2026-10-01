import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Header,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import { format } from "date-fns";
import type { AdminProduct, ImportResult } from "@repo/types";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import type { Paginated } from "../common/paginated.js";
import {
  BulkIdsDto,
  BulkStatusDto,
  CreateProductDto,
  ImportProductsDto,
  ProductListQueryDto,
  UpdateProductDto,
} from "./dto/product.dto.js";
import { ProductCsvService } from "./product-csv.service.js";
import { ProductsService } from "./products.service.js";

@Controller("admin/products")
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly csv: ProductCsvService,
  ) {}

  @Get()
  list(@Query() query: ProductListQueryDto): Promise<Paginated<AdminProduct>> {
    return this.products.list(query);
  }

  @Get("export")
  @Header("Content-Type", "text/csv; charset=utf-8")
  async exportCsv(
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const body = await this.csv.exportCsv();
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="products-${format(new Date(), "yyyy-MM-dd")}.csv"`,
    );
    return new StreamableFile(Buffer.from(body, "utf8"));
  }

  @Post("import")
  @HttpCode(HttpStatus.OK)
  importProducts(@Body() dto: ImportProductsDto): Promise<ImportResult> {
    return this.csv.import(dto);
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
