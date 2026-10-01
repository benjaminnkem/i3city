"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const CODE_PATTERN = /^I3-[A-Z0-9]{6}$/;

export function TrackForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalised = code.trim().toUpperCase();
    if (!CODE_PATTERN.test(normalised)) {
      setError("Enter your order code, for example I3-AB23CD");
      return;
    }
    router.push(`/order/${normalised}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex max-w-md flex-col gap-4"
    >
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="code">Order code</FieldLabel>
        <Input
          id="code"
          value={code}
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="I3-AB23CD"
          onChange={(event) => setCode(event.target.value)}
          aria-invalid={error ? true : undefined}
        />
        <FieldDescription>
          You can find it in your confirmation and WhatsApp message.
        </FieldDescription>
        <FieldError>{error}</FieldError>
      </Field>
      <Button type="submit" size="lg">
        Track order
      </Button>
    </form>
  );
}
