import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import type { PaymentLink, PublicOrder } from "@repo/types";
import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";
import type { Request } from "express";
import { PaymentsService } from "./payments.service.js";
import { PaystackService } from "./paystack.service.js";

class PayOrderDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;
}

class VerifyQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  trxref?: string;
}

interface WebhookPayload {
  event?: string;
  data?: { reference?: string };
}

@Controller()
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly paystack: PaystackService,
  ) {}

  @Post("orders/:code/pay")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async pay(
    @Param("code") code: string,
    @Body() dto: PayOrderDto,
  ): Promise<PaymentLink> {
    return {
      authorizationUrl: await this.payments.startForExisting(code, dto.email),
    };
  }

  @Get("orders/:code/verify")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  verify(
    @Param("code") code: string,
    @Query() query: VerifyQueryDto,
  ): Promise<PublicOrder> {
    return this.payments.verifyForCustomer(
      code,
      query.reference ?? query.trxref,
    );
  }

  @Post("payments/paystack/webhook")
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  async webhook(
    @Req() request: Request & { rawBody?: Buffer },
    @Body() body: WebhookPayload,
  ): Promise<{ received: true }> {
    const signature = request.headers["x-paystack-signature"];
    if (
      !this.paystack.verifySignature(
        request.rawBody,
        typeof signature === "string" ? signature : undefined,
      )
    ) {
      throw new UnauthorizedException("Invalid signature");
    }
    if (body.event === "charge.success" && body.data?.reference) {
      await this.payments.settle(body.data.reference);
    }
    return { received: true };
  }
}
