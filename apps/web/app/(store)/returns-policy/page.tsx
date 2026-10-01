import type { Metadata } from "next";
import { ContactLines } from "@/components/legal/contact-lines";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { fetchSettings } from "@/lib/store/api";
import { LEGAL_UPDATED } from "@/lib/store/legal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Returns policy",
  description:
    "What to do if your i3City order arrives damaged, wrong or faulty, and how returns and refunds work.",
  alternates: { canonical: "/returns-policy" },
};

export default async function ReturnsPolicyPage() {
  const settings = await fetchSettings();
  return (
    <LegalPage title="Returns policy" updated={LEGAL_UPDATED}>
      <LegalSection title="Our promise">
        <p>
          We want you to be happy with what you buy. If something is wrong with
          your order, tell us and we will put it right.
        </p>
      </LegalSection>
      <LegalSection title="What we will fix">
        <ul>
          <li>The item arrived damaged.</li>
          <li>You received the wrong item or colour.</li>
          <li>The item does not work when you first use it.</li>
          <li>Something from your order is missing.</li>
        </ul>
        <p>
          Contact us within <strong>48 hours</strong> of delivery with your
          order code and a photo or short video of the problem. We will repair,
          replace or refund, depending on stock and what you prefer.
        </p>
      </LegalSection>
      <LegalSection title="Changing your mind">
        <p>
          If an item is unopened, unused and in its original packaging, you can
          ask to return it within <strong>3 days</strong> of delivery. You pay
          the cost of sending it back, and delivery fees are not refunded.
          Opened or used accessories, such as earbuds and cases, cannot be
          returned for hygiene and compatibility reasons unless faulty.
        </p>
      </LegalSection>
      <LegalSection title="How to return an item">
        <ul>
          <li>Message us with your order code and the reason.</li>
          <li>We reply with the next step and where to send the item.</li>
          <li>Keep your proof of postage until we confirm we received it.</li>
        </ul>
      </LegalSection>
      <LegalSection title="Refunds">
        <p>
          Approved refunds go back to the way you paid. Card payments are
          refunded to the same card through Paystack, which can take several
          business days to show. Transfer payments are refunded to the account
          you tell us.
        </p>
      </LegalSection>
      <LegalSection title="Cancelling an order">
        <p>
          You can cancel before we ship by messaging us. If you already paid, we
          refund you in full. Orders that are not paid within the payment window
          are cancelled automatically.
        </p>
      </LegalSection>
      <LegalSection title="Contact us">
        <ContactLines settings={settings} />
      </LegalSection>
    </LegalPage>
  );
}
