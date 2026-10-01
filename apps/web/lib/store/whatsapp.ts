export function whatsappLink(number: string, message: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

export function whatsappSessionKey(code: string): string {
  return `i3-wa-${code}`;
}
