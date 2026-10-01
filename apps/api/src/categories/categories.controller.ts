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
  Put,
  UseGuards,
} from "@nestjs/common";
import type { AdminCategory } from "@repo/types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CategoriesService } from "./categories.service.js";
import {
  CreateCategoryDto,
  ReorderCategoriesDto,
  UpdateCategoryDto,
} from "./dto/category.dto.js";

@Controller("admin/categories")
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list(): Promise<AdminCategory[]> {
    return this.categories.list();
  }

  @Post()
  create(@Body() dto: CreateCategoryDto): Promise<AdminCategory> {
    return this.categories.create(dto);
  }

  @Put("order")
  reorder(@Body() dto: ReorderCategoriesDto): Promise<AdminCategory[]> {
    return this.categories.reorder(dto);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<AdminCategory> {
    return this.categories.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string): Promise<void> {
    return this.categories.remove(id);
  }
}
