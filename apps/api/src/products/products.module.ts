import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { ProductsController } from "./products.controller.js";
import { ProductCsvService } from "./product-csv.service.js";
import { ProductsService } from "./products.service.js";

@Module({
  imports: [AuthModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductCsvService],
})
export class ProductsModule {}
