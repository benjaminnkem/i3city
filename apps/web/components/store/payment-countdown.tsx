"use client";

import { differenceInSeconds, parseISO } from "date-fns";
import { useEffect, useState } from "react";

function format(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function PaymentCountdown({
  expiresAt,
}: Readonly<{ expiresAt: string }>) {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    const tick = () =>
      setSeconds(
        Math.max(0, differenceInSeconds(parseISO(expiresAt), new Date())),
      );
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  if (seconds === null) return null;
  return (
    <p className="text-muted-foreground">
      {seconds > 0 ? (
        <>
          We are holding your items for{" "}
          <span className="price text-foreground font-bold">
            {format(seconds)}
          </span>
          .
        </>
      ) : (
        "The payment window has ended. If you have just paid, this page will update shortly."
      )}
    </p>
  );
}
