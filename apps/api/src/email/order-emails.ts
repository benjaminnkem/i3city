import { formatNaira } from "@repo/types";
import type { EmailMessage } from "./email.service.js";

export interface OrderEmailData {
  code: string;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  state: string;
  note: string | null;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
}

type EmailBody = Omit<EmailMessage, "to">;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function itemLines(data: OrderEmailData): string[] {
  return data.items.map(
    (item) =>
      `${item.quantity} x ${item.name} (${formatNaira(item.price * item.quantity)})`,
  );
}

function totalsLines(data: OrderEmailData): string[] {
  return [
    `Subtotal: ${formatNaira(data.subtotal)}`,
    `Delivery: ${formatNaira(data.shippingFee)}`,
    `Total: ${formatNaira(data.total)}`,
  ];
}

function wrap(
  title: string,
  lines: string[],
  link?: { href: string; label: string },
): string {
  const body = lines
    .map((line) =>
      line === ""
        ? "<br>"
        : `<p style="margin:0 0 6px">${escapeHtml(line)}</p>`,
    )
    .join("");
  const action = link
    ? `<p style="margin:20px 0"><a href="${escapeHtml(link.href)}" style="background:#c21e5b;color:#fff;padding:12px 20px;border-radius:24px;text-decoration:none;font-weight:700">${escapeHtml(link.label)}</a></p>`
    : "";
  return `<div style="font-family:Arial,sans-serif;color:#1d1320;max-width:520px"><h2 style="margin:0 0 16px">${escapeHtml(title)}</h2>${body}${action}</div>`;
}

export function ownerNewOrderEmail(
  data: OrderEmailData,
  adminUrl: string,
): EmailBody {
  const lines = [
    `${data.customerName} placed order ${data.code}.`,
    "",
    ...itemLines(data),
    "",
    ...totalsLines(data),
    "",
    `Phone: ${data.phone}`,
    `Deliver to: ${data.address}, ${data.city}, ${data.state}`,
    ...(data.note ? [`Note: ${data.note}`] : []),
    `Payment: ${data.paymentMethod === "WHATSAPP" ? "arranged on WhatsApp" : "card or transfer"}`,
  ];
  return {
    subject: `New order ${data.code}, ${formatNaira(data.total)}`,
    html: wrap(`New order ${data.code}`, lines, {
      href: adminUrl,
      label: "Open order",
    }),
    text: [...lines, "", adminUrl].join("\n"),
  };
}

export function customerConfirmationEmail(
  data: OrderEmailData,
  storeName: string,
  trackingUrl: string,
): EmailBody {
  const lines = [
    `Hi ${data.customerName}, thanks for your order with ${storeName}.`,
    `Your order code is ${data.code}.`,
    "",
    ...itemLines(data),
    "",
    ...totalsLines(data),
    "",
    "We will confirm your order and share payment details on WhatsApp.",
  ];
  return {
    subject: `Your ${storeName} order ${data.code}`,
    html: wrap("Thanks for your order", lines, {
      href: trackingUrl,
      label: "Track your order",
    }),
    text: [...lines, "", `Track your order: ${trackingUrl}`].join("\n"),
  };
}

export function customerShippedEmail(
  data: OrderEmailData,
  storeName: string,
  trackingUrl: string,
  courier: string | null,
  trackingNumber: string | null,
): EmailBody {
  const lines = [
    `Hi ${data.customerName}, your order ${data.code} has shipped.`,
    ...(courier ? [`Courier: ${courier}`] : []),
    ...(trackingNumber ? [`Tracking number: ${trackingNumber}`] : []),
  ];
  return {
    subject: `Your ${storeName} order ${data.code} has shipped`,
    html: wrap("Your order is on its way", lines, {
      href: trackingUrl,
      label: "Track your order",
    }),
    text: [...lines, "", `Track your order: ${trackingUrl}`].join("\n"),
  };
}
