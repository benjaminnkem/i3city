"use client";

import { Container } from "@/components/store/section";
import { Button } from "@/components/ui/button";

export default function StoreError({
  reset,
}: Readonly<{ error: Error; reset: () => void }>) {
  return (
    <Container className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-h2 font-extrabold">Something went wrong</h1>
      <p className="text-muted-foreground">
        We could not load this page. Try again in a moment.
      </p>
      <Button size="lg" onClick={reset}>
        Try again
      </Button>
    </Container>
  );
}
