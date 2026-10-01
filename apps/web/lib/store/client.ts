import type { CreateOrderResult, ValidatedCartLine } from "@repo/types";
import { request } from "@/lib/api";
import type { CartLine } from "@/lib/cart/store";

export function validateCart(lines: CartLine[]): Promise<ValidatedCartLine[]> {
  return request<ValidatedCartLine[]>({
    method: "post",
    url: "/cart/validate",
    data: {
      items: lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        price: line.price,
      })),
    },
  });
}

export interface OrderInput {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  note: string;
  paymentMethod: "WHATSAPP" | "PAYSTACK";
  items: { productId: string; quantity: number }[];
}

export function placeOrder(input: OrderInput): Promise<CreateOrderResult> {
  return request<CreateOrderResult>({
    method: "post",
    url: "/orders",
    data: input,
  });
}
