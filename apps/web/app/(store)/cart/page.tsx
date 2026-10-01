import { CartView } from "@/components/store/cart-view";

export const metadata = { title: "Your cart", robots: { index: false } };

export default function CartPage() {
  return <CartView />;
}
