import type { Metadata } from "next";
import { ContactLines } from "@/components/legal/contact-lines";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { fetchSettings } from "@/lib/store/api";
import { LEGAL_UPDATED } from "@/lib/store/legal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What personal information i3City collects when you shop, how we use it and the choices you have.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const settings = await fetchSettings();
  return (
    <LegalPage title="Privacy policy" updated={LEGAL_UPDATED}>
      <LegalSection title="Who we are">
        <p>
          {settings.storeName} is an online store for phones, gadgets and
          accessories in Nigeria. This page explains how we handle your personal
          information in line with the Nigeria Data Protection Act.
        </p>
      </LegalSection>
      <LegalSection title="What we collect">
        <ul>
          <li>
            <strong>Order details:</strong> your name, phone number, email
            (optional unless you pay by card), delivery address and state, and
            the items you order.
          </li>
          <li>
            <strong>Payment status:</strong> whether and when an order was paid.
            Card details are entered on Paystack and never reach our servers.
          </li>
          <li>
            <strong>Messages:</strong> what you send us on WhatsApp or email.
          </li>
          <li>
            <strong>Basic technical data:</strong> your cart is saved in your
            browser, and our servers keep standard logs such as IP address to
            keep the site secure.
          </li>
        </ul>
      </LegalSection>
      <LegalSection title="How we use it">
        <ul>
          <li>To confirm, pack, deliver and support your order.</li>
          <li>To send order confirmations and shipping updates.</li>
          <li>To prevent fraud and keep the store secure.</li>
          <li>To meet legal and accounting duties.</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </LegalSection>
      <LegalSection title="Who we share it with">
        <ul>
          <li>Couriers, so they can deliver your parcel.</li>
          <li>Paystack, which processes card and transfer payments.</li>
          <li>
            Service providers that run the store for us, such as hosting,
            database, image storage and email delivery.
          </li>
          <li>Authorities, where the law requires it.</li>
        </ul>
      </LegalSection>
      <LegalSection title="Cookies and local storage">
        <p>
          We use your browser&apos;s storage to remember your cart and your
          light or dark theme. Our admin area uses a sign-in cookie for the
          store team. If we add analytics or advertising tools, we will update
          this page and ask for your consent where the law requires.
        </p>
      </LegalSection>
      <LegalSection title="How long we keep it">
        <p>
          We keep order records for as long as needed for delivery, support,
          returns and our legal and tax obligations, then delete or anonymise
          them.
        </p>
      </LegalSection>
      <LegalSection title="Your rights">
        <p>
          You can ask to see the information we hold about you, correct it, or
          ask us to delete it where we are not required to keep it. You can also
          object to how we use it. Contact us and we will respond promptly.
        </p>
      </LegalSection>
      <LegalSection title="Contact us">
        <ContactLines settings={settings} />
      </LegalSection>
    </LegalPage>
  );
}
