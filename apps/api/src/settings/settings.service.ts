import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { PaystackService } from "../payments/paystack.service.js";
import type { AdminSettings, ShippingRateInfo } from "@repo/types";
import { PrismaService } from "../prisma/prisma.service.js";
import type {
  UpdateSettingsDto,
  UpdateShippingRatesDto,
} from "./dto/settings.dto.js";

const DEFAULT_WHATSAPP = "2348133961439";

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackService,
  ) {}

  async get(): Promise<AdminSettings> {
    const row = await this.prisma.storeSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, whatsappNumber: DEFAULT_WHATSAPP },
    });
    return {
      storeName: row.storeName,
      whatsappNumber: row.whatsappNumber,
      supportEmail: row.supportEmail,
      address: row.address,
      openingHours: row.openingHours,
      bankDetails: row.bankDetails,
      defaultShippingFee: row.defaultShippingFee,
      freeShippingOver: row.freeShippingOver,
      paystackEnabled: row.paystackEnabled,
      paystackConfigured: this.paystack.configured,
    };
  }

  async update(dto: UpdateSettingsDto): Promise<AdminSettings> {
    await this.get();
    if (dto.paystackEnabled && !this.paystack.configured) {
      throw new UnprocessableEntityException(
        "Add the Paystack secret key to the server before turning on card payments",
      );
    }
    await this.prisma.storeSettings.update({
      where: { id: 1 },
      data: {
        storeName: dto.storeName.trim(),
        whatsappNumber: dto.whatsappNumber,
        supportEmail: dto.supportEmail ?? null,
        address: dto.address ?? null,
        openingHours: dto.openingHours ?? null,
        bankDetails: dto.bankDetails ?? null,
        defaultShippingFee: dto.defaultShippingFee,
        freeShippingOver: dto.freeShippingOver ?? null,
        paystackEnabled: dto.paystackEnabled,
      },
    });
    return this.get();
  }

  async listRates(): Promise<ShippingRateInfo[]> {
    const rows = await this.prisma.shippingRate.findMany({
      orderBy: { state: "asc" },
    });
    return rows.map((row) => ({
      state: row.state,
      fee: row.fee,
      etaDays: row.etaDays,
    }));
  }

  async updateRates(dto: UpdateShippingRatesDto): Promise<ShippingRateInfo[]> {
    await this.prisma.$transaction(
      dto.rates.map((rate) =>
        this.prisma.shippingRate.upsert({
          where: { state: rate.state },
          update: { fee: rate.fee, etaDays: rate.etaDays ?? null },
          create: {
            state: rate.state,
            fee: rate.fee,
            etaDays: rate.etaDays ?? null,
          },
        }),
      ),
    );
    return this.listRates();
  }
}
