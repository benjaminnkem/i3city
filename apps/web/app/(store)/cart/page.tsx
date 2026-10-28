import { CartView } from "@/components/store/cart-view";

export const metadata = {
  title: "Your cart",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function CartPage() {
  return <CartView />;
}
