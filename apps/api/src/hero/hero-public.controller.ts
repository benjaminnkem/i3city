import { Controller, Get } from "@nestjs/common";
import type { PublicHeroSlide } from "@repo/types";
import { HeroService } from "./hero.service.js";

@Controller("hero")
export class HeroPublicController {
  constructor(private readonly hero: HeroService) {}

  @Get()
  list(): Promise<PublicHeroSlide[]> {
    return this.hero.listLive();
  }
}
