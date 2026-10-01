import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AllExceptionsFilter } from "./common/all-exceptions.filter.js";
import { ResponseInterceptor } from "./common/response.interceptor.js";
import { AuthModule } from "./auth/auth.module.js";
import { EmailModule } from "./email/email.module.js";
import { ConfigModule } from "./config/config.module.js";
import { ENV, type Env } from "./config/env.js";
import { CatalogModule } from "./catalog/catalog.module.js";
import { CategoriesModule } from "./categories/categories.module.js";
import { HealthModule } from "./health/health.module.js";
import { OrdersModule } from "./orders/orders.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { ProductsModule } from "./products/products.module.js";
import { SettingsModule } from "./settings/settings.module.js";
import { StatsModule } from "./stats/stats.module.js";
import { StorageModule } from "./storage/storage.module.js";
import { UploadsModule } from "./uploads/uploads.module.js";

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      inject: [ENV],
      useFactory: (env: Env) => ({
        throttlers: [{ ttl: 60_000, limit: 100 }],
        skipIf: () => env.NODE_ENV === "test",
      }),
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    StorageModule,
    CategoriesModule,
    ProductsModule,
    UploadsModule,
    StatsModule,
    EmailModule,
    SettingsModule,
    CatalogModule,
    OrdersModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
