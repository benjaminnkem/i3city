import { formatNigerianPhone } from "@repo/types";
import type { OrderEmailData } from "../email/order-emails.js";
import type { OrderRow } from "./order.mapper.js";

export function orderEmailData(row: OrderRow): OrderEmailData {
  return {
    code: row.code,
    customerName: row.customerName,
    phone: formatNigerianPhone(row.phone),
    email: row.email,
    address: row.address,
    city: row.city,
    state: row.state,
    note: row.note,
    items: row.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
    subtotal: row.subtotal,
    shippingFee: row.shippingFee,
    total: row.total,
    paymentMethod: row.paymentMethod,
  };
}
