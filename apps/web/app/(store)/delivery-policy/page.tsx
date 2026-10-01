import { formatNaira, PAYMENT_WINDOW_MINUTES } from "@repo/types";
import type { Metadata } from "next";
import Link from "next/link";
import { ContactLines } from "@/components/legal/contact-lines";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { fetchSettings } from "@/lib/store/api";
import { LEGAL_UPDATED } from "@/lib/store/legal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Delivery policy",
  description:
    "Where we deliver, what it costs and how long it takes. i3City delivers to every state in Nigeria.",
  alternates: { canonical: "/delivery-policy" },
};

export default async function DeliveryPolicyPage() {
  const settings = await fetchSettings();
  const rates = [...settings.shippingRates].sort((a, b) =>
    a.state.localeCompare(b.state),
  );
  return (
    <LegalPage title="Delivery policy" updated={LEGAL_UPDATED}>
      <LegalSection title="Where we deliver">
        <p>
          We deliver to every state in Nigeria, including the FCT. Orders are
          packed and handed to a courier from our store.
        </p>
      </LegalSection>
      <LegalSection title="Delivery fees and times">
        <p>
          The fee depends on your state and is shown at checkout before you
          place your order.
          {settings.freeShippingOver
            ? ` Orders of ${formatNaira(settings.freeShippingOver)} or more ship free.`
            : ""}{" "}
          States without a listed rate are charged{" "}
          {formatNaira(settings.defaultShippingFee)}.
        </p>
        <div className="border-border overflow-hidden rounded-md border">
          <table className="w-full text-left">
            <thead className="bg-muted text-foreground">
              <tr>
                <th className="px-4 py-3 font-bold">State</th>
                <th className="px-4 py-3 font-bold">Fee</th>
                <th className="px-4 py-3 font-bold">Estimated time</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <tr key={rate.state} className="border-border border-t">
                  <td className="px-4 py-2.5">{rate.state}</td>
                  <td className="price px-4 py-2.5">{formatNaira(rate.fee)}</td>
                  <td className="px-4 py-2.5">
                    {rate.etaDays
                      ? `${rate.etaDays} days`
                      : "Confirmed on order"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Delivery times are estimates and count working days from the day we
          dispatch. Public holidays and courier delays can add time.
        </p>
      </LegalSection>
      <LegalSection title="How an order moves">
        <ul>
          <li>
            We confirm your order on WhatsApp and check stock and delivery
            details with you.
          </li>
          <li>
            If you pay by card or transfer on Paystack, we hold your items for{" "}
            {PAYMENT_WINDOW_MINUTES} minutes. An unpaid card order is cancelled
            after that and the items go back on sale.
          </li>
          <li>
            Once your order is paid and packed, we ship it and send you the
            courier details and tracking number.
          </li>
          <li>
            You can follow any order on the{" "}
            <Link href="/track">track your order</Link> page with your order
            code.
          </li>
        </ul>
      </LegalSection>
      <LegalSection title="Receiving your order">
        <p>
          Please give an address and phone number where someone can receive the
          parcel. Check the package when it arrives and tell us within 24 hours
          if it is damaged or something is missing. See our{" "}
          <Link href="/returns-policy">returns policy</Link> for next steps.
        </p>
      </LegalSection>
      <LegalSection title="Questions about delivery">
        <ContactLines settings={settings} />
      </LegalSection>
    </LegalPage>
  );
}
