import { isPlaceholderWhatsApp, type PublicSettings } from "@repo/types";
import { whatsappLink } from "./whatsapp";

export const LEGAL_UPDATED = "1 October 2026";

export function contactDetails(settings: PublicSettings) {
  const hasWhatsApp = !isPlaceholderWhatsApp(settings.whatsappNumber);
  return {
    email: settings.supportEmail,
    whatsappHref: hasWhatsApp
      ? whatsappLink(settings.whatsappNumber, "Hello, I have a question.")
      : null,
    address: settings.address,
  };
}
