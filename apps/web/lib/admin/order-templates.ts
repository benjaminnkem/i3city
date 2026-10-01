import {
  formatNaira,
  formatNigerianPhone,
  type AdminOrder,
  type AdminSettings,
} from "@repo/types";

export function whatsappToCustomer(phone: string, message: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

export function paymentDetailsMessage(
  order: AdminOrder,
  settings: AdminSettings,
): string {
  return [
    `Hello ${order.customerName}, thank you for your order ${order.code}.`,
    "",
    ...order.items.map((item) => `- ${item.quantity} x ${item.name}`),
    "",
    `Total to pay: ${formatNaira(order.total)} (including delivery of ${formatNaira(order.shippingFee)})`,
    "",
    settings.bankDetails
      ? `Please transfer to:\n${settings.bankDetails}`
      : "We will send our payment details shortly.",
    "",
    "Reply with your payment receipt and we will pack your order right away.",
  ].join("\n");
}

export function shippedMessage(order: AdminOrder, trackingUrl: string): string {
  return [
    `Hello ${order.customerName}, your order ${order.code} has shipped.`,
    ...(order.courier ? [`Courier: ${order.courier}`] : []),
    ...(order.trackingNumber
      ? [`Tracking number: ${order.trackingNumber}`]
      : []),
    "",
    `Track it here: ${trackingUrl}`,
  ].join("\n");
}

export function customerPhone(order: AdminOrder): string {
  return formatNigerianPhone(order.phone);
}
