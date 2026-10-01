"use client";

import { RefreshCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { verifyOrderPayment } from "@/lib/store/client";

const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 6;

export function VerifyPayment({
  code,
  reference,
}: Readonly<{ code: string; reference?: string }>) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "waiting">("checking");
  const attempts = useRef(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    attempts.current = 0;
    setState("checking");

    async function check() {
      attempts.current += 1;
      try {
        const order = await verifyOrderPayment(code, reference);
        if (cancelled) return;
        if (order.paymentStatus === "PAID") {
          router.replace(`/order/${code}?paid=1`);
          router.refresh();
          return;
        }
        if (order.paymentStatus === "FAILED") {
          router.replace(`/order/${code}`);
          router.refresh();
          return;
        }
      } catch {
        void 0;
      }
      if (cancelled) return;
      if (attempts.current >= MAX_ATTEMPTS) {
        setState("waiting");
        return;
      }
      timer = setTimeout(() => void check(), POLL_INTERVAL_MS);
    }

    void check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [code, reference, router, run]);

  return (
    <div
      role="status"
      className="bg-muted flex flex-wrap items-center gap-3 rounded-lg px-5 py-4"
    >
      <RefreshCwIcon
        className={state === "checking" ? "size-5 animate-spin" : "size-5"}
      />
      <p className="flex-1 font-bold">
        {state === "checking"
          ? "Confirming your payment"
          : "We have not received confirmation yet. This can take a minute."}
      </p>
      {state === "waiting" ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRun((value) => value + 1)}
        >
          Check again
        </Button>
      ) : null}
    </div>
  );
}
