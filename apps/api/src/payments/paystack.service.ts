import {
  BadGatewayException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { ENV, type Env } from "../config/env.js";
import { verifyPaystackSignature } from "./paystack-signature.js";

const REQUEST_TIMEOUT_MS = 10_000;

export interface PaystackTransaction {
  status: string;
  reference: string;
  amount: number;
  currency: string;
}

export interface InitializeInput {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  orderCode: string;
}

interface PaystackEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly secret: string | undefined;
  private readonly apiUrl: string;

  constructor(@Inject(ENV) env: Env) {
    this.secret = env.PAYSTACK_SECRET_KEY;
    this.apiUrl = env.PAYSTACK_API_URL.replace(/\/+$/, "");
  }

  get configured(): boolean {
    return this.secret !== undefined;
  }

  verifySignature(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ): boolean {
    return (
      this.secret !== undefined &&
      verifyPaystackSignature(this.secret, rawBody, signature)
    );
  }

  async initialize(
    input: InitializeInput,
  ): Promise<{ authorizationUrl: string }> {
    const data = await this.request<{ authorization_url: string }>(
      "POST",
      "/transaction/initialize",
      {
        email: input.email,
        amount: input.amountKobo,
        currency: "NGN",
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: { order_code: input.orderCode },
      },
    );
    return { authorizationUrl: data.authorization_url };
  }

  async verify(reference: string): Promise<PaystackTransaction> {
    const data = await this.request<PaystackTransaction>(
      "GET",
      `/transaction/verify/${encodeURIComponent(reference)}`,
    );
    return {
      status: data.status,
      reference: data.reference,
      amount: data.amount,
      currency: data.currency,
    };
  }

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
  ): Promise<T> {
    if (!this.secret) {
      throw new BadGatewayException("Card payments are not configured");
    }
    let response: Response;
    try {
      response = await fetch(`${this.apiUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.secret}`,
          "Content-Type": "application/json",
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.warn(
        `Paystack ${method} ${path} failed: ${error instanceof Error ? error.message : "unknown"}`,
      );
      throw new BadGatewayException("We could not reach the payment provider");
    }
    const json = (await response
      .json()
      .catch(() => null)) as PaystackEnvelope<T> | null;
    if (!response.ok || !json?.status) {
      this.logger.warn(
        `Paystack ${method} ${path} returned ${response.status}: ${json?.message ?? "no message"}`,
      );
      throw new BadGatewayException(
        json?.message ?? "The payment provider rejected the request",
      );
    }
    return json.data;
  }
}
