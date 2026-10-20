import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { HeroPublicController } from "./hero-public.controller.js";
import { HeroController } from "./hero.controller.js";
import { HeroService } from "./hero.service.js";

@Module({
  imports: [AuthModule],
  controllers: [HeroController, HeroPublicController],
  providers: [HeroService],
})
export class HeroModule {}
