import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import type { AdminHeroSlide } from "@repo/types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { HeroSlideDto, ReorderHeroSlidesDto } from "./dto/hero.dto.js";
import { HeroService } from "./hero.service.js";

@Controller("admin/hero")
@UseGuards(JwtAuthGuard)
export class HeroController {
  constructor(private readonly hero: HeroService) {}

  @Get()
  list(): Promise<AdminHeroSlide[]> {
    return this.hero.list();
  }

  @Post()
  create(@Body() dto: HeroSlideDto): Promise<AdminHeroSlide> {
    return this.hero.create(dto);
  }

  @Put("order")
  reorder(@Body() dto: ReorderHeroSlidesDto): Promise<AdminHeroSlide[]> {
    return this.hero.reorder(dto);
  }

  @Get(":id")
  get(@Param("id") id: string): Promise<AdminHeroSlide> {
    return this.hero.get(id);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() dto: HeroSlideDto,
  ): Promise<AdminHeroSlide> {
    return this.hero.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string): Promise<void> {
    return this.hero.remove(id);
  }
}
