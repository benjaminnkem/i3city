import { formatNaira } from "@repo/types";

export interface WhatsAppOrderMessage {
  code: string;
  customerName: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  shippingFee: number;
  total: number;
  address: string;
  city: string;
  state: string;
  trackingUrl: string;
}

export function buildOrderMessage(order: WhatsAppOrderMessage): string {
  return [
    `Hello, I just placed order ${order.code}.`,
    "",
    "Items:",
    ...order.items.map(
      (item) =>
        `- ${item.quantity} x ${item.name} (${formatNaira(item.price * item.quantity)})`,
    ),
    "",
    `Subtotal: ${formatNaira(order.subtotal)}`,
    `Delivery: ${formatNaira(order.shippingFee)}`,
    `Total: ${formatNaira(order.total)}`,
    "",
    "Deliver to:",
    order.customerName,
    `${order.address}, ${order.city}, ${order.state}`,
    "",
    `Track my order: ${order.trackingUrl}`,
  ].join("\n");
}

export function whatsappLink(number: string, message: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
