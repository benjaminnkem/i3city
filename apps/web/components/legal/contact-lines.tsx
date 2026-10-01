import type { PublicSettings } from "@repo/types";
import { contactDetails } from "@/lib/store/legal";

export function ContactLines({
  settings,
}: Readonly<{ settings: PublicSettings }>) {
  const { email, whatsappHref, address } = contactDetails(settings);
  return (
    <ul>
      {whatsappHref ? (
        <li>
          WhatsApp: <a href={whatsappHref}>message us</a>
        </li>
      ) : null}
      {email ? (
        <li>
          Email: <a href={`mailto:${email}`}>{email}</a>
        </li>
      ) : null}
      {address ? <li>Store: {address}</li> : null}
    </ul>
  );
}
