import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/store/section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function StoreNotFound() {
  return (
    <Container className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-h2 font-extrabold">We could not find that page</h1>
      <p className="text-muted-foreground">
        It may have moved, or the link may be wrong.
      </p>
      <div className="flex gap-3">
        <Button size="lg" nativeButton={false} render={<Link href="/shop" />}>
          Browse products
        </Button>
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          render={<Link href="/track" />}
        >
          Track an order
        </Button>
      </div>
    </Container>
  );
}
