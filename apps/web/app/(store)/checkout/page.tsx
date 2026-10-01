import { CheckoutForm } from "@/components/store/checkout-form";
import { fetchSettings } from "@/lib/store/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  return <CheckoutForm settings={await fetchSettings()} />;
}
