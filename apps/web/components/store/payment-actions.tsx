"use client";

import { CreditCardIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toApiError } from "@/lib/api";
import { payForOrder } from "@/lib/store/client";

export function PayOnlineButton({
  code,
  label = "Pay with card or transfer",
  variant = "default",
}: Readonly<{
  code: string;
  label?: string;
  variant?: "default" | "outline";
}>) {
  const [pending, setPending] = useState(false);
  const [askEmail, setAskEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    if (askEmail && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address");
      return;
    }
    setPending(true);
    try {
      const { authorizationUrl } = await payForOrder(
        code,
        askEmail ? email.trim() : undefined,
      );
      window.location.assign(authorizationUrl);
    } catch (failure) {
      const apiError = toApiError(failure);
      if (apiError.status === 422 && /email/i.test(apiError.message)) {
        setAskEmail(true);
        setError("Add your email address so Paystack can send your receipt");
      } else {
        setError(
          apiError.code === "NETWORK_ERROR"
            ? "We could not reach the store. Check your connection and try again."
            : apiError.message,
        );
      }
      setPending(false);
    }
  }

  return (
    <div className="flex max-w-md flex-col gap-3">
      {askEmail ? (
        <Field data-invalid={error ? true : undefined}>
          <FieldLabel htmlFor="pay-email">Email address</FieldLabel>
          <Input
            id="pay-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={error ? true : undefined}
          />
          <FieldError>{error}</FieldError>
        </Field>
      ) : error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <Button
        size="lg"
        variant={variant}
        disabled={pending}
        onClick={() => void start()}
      >
        <CreditCardIcon data-icon="inline-start" />
        {pending ? "Opening Paystack" : label}
      </Button>
    </div>
  );
}
