"use client";

import {
  NIGERIA_STATES,
  calculateShipping,
  formatNaira,
  normaliseNigerianPhone,
  stateLabel,
  type PublicSettings,
} from "@repo/types";
import { LockIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toApiError } from "@/lib/api";
import { useCartStore } from "@/lib/cart/store";
import { useCart } from "@/lib/cart/use-cart";
import { useValidatedCart } from "@/lib/cart/use-validated-cart";
import {
  checkoutSchema,
  type CheckoutValues,
} from "@/lib/store/checkout-schema";
import { placeOrder } from "@/lib/store/client";
import { whatsappSessionKey } from "@/lib/store/whatsapp";
import { Container } from "./section";

type Errors = Partial<Record<keyof CheckoutValues, string>>;

const EMPTY: CheckoutValues = {
  customerName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  note: "",
};

const STATE_ITEMS = NIGERIA_STATES.map((state) => ({
  value: state,
  label: stateLabel(state),
}));

export function CheckoutForm({
  settings,
}: Readonly<{ settings: PublicSettings }>) {
  const router = useRouter();
  const { ready, lines, subtotal } = useCart();
  const clear = useCartStore((state) => state.clear);
  const { notices, checking } = useValidatedCart();
  const [values, setValues] = useState<CheckoutValues>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [method, setMethod] = useState<"WHATSAPP" | "PAYSTACK">("WHATSAPP");
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const quote = useMemo(
    () =>
      values.state
        ? calculateShipping({
            subtotal,
            state: values.state,
            rates: settings.shippingRates,
            defaultFee: settings.defaultShippingFee,
            freeShippingOver: settings.freeShippingOver,
          })
        : null,
    [values.state, subtotal, settings],
  );
  const total = subtotal + (quote?.fee ?? 0);

  function set<K extends keyof CheckoutValues>(
    key: K,
    value: CheckoutValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailure(null);
    const parsed = checkoutSchema.safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof CheckoutValues | undefined;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const result = await placeOrder({
        ...parsed.data,
        phone: normaliseNigerianPhone(parsed.data.phone) ?? parsed.data.phone,
        paymentMethod: method,
        items: lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
        })),
      });
      try {
        sessionStorage.setItem(
          whatsappSessionKey(result.order.code),
          result.whatsappUrl,
        );
      } catch {
        void 0;
      }
      clear();
      router.push(`/order/${result.order.code}?placed=1`);
    } catch (error) {
      const apiError = toApiError(error);
      setFailure(
        apiError.code === "NETWORK_ERROR"
          ? "We could not reach the store. Check your connection and try again."
          : apiError.message,
      );
      setSubmitting(false);
    }
  }

  if (!ready || checking) {
    return (
      <Container className="py-8">
        <Skeleton className="mb-6 h-10 w-48" />
        <Skeleton className="h-96 rounded-md" />
      </Container>
    );
  }

  if (lines.length === 0 && !submitting) {
    return (
      <Container className="flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-h2 font-extrabold">Your cart is empty</h1>
        <p className="text-muted-foreground">
          Add something to your cart before checking out.
        </p>
        <Button size="lg" nativeButton={false} render={<Link href="/shop" />}>
          Start shopping
        </Button>
      </Container>
    );
  }

  const invalid = (key: keyof CheckoutValues) =>
    errors[key] ? true : undefined;

  return (
    <Container className="py-8">
      <h1 className="text-h2 mb-6 font-extrabold">Checkout</h1>
      {notices.length > 0 ? (
        <Alert className="mb-6">
          <AlertTitle>We updated your cart</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5">
              {notices.map((notice) => (
                <li key={notice}>{notice}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
      {failure ? (
        <Alert className="mb-6" role="alert">
          <AlertTitle>We could not place your order</AlertTitle>
          <AlertDescription>{failure}</AlertDescription>
        </Alert>
      ) : null}

      <form
        onSubmit={onSubmit}
        noValidate
        className="grid gap-8 lg:grid-cols-[1fr_24rem]"
      >
        <div className="flex flex-col gap-8">
          <section aria-labelledby="contact" className="flex flex-col gap-4">
            <h2 id="contact" className="text-lg font-extrabold">
              Contact and delivery
            </h2>
            <FieldGroup>
              <Field data-invalid={invalid("customerName")}>
                <FieldLabel htmlFor="customerName">Full name</FieldLabel>
                <Input
                  id="customerName"
                  autoComplete="name"
                  value={values.customerName}
                  onChange={(event) => set("customerName", event.target.value)}
                  aria-invalid={invalid("customerName")}
                />
                <FieldError>{errors.customerName}</FieldError>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={invalid("phone")}>
                  <FieldLabel htmlFor="phone">Phone number</FieldLabel>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="0801 234 5678"
                    value={values.phone}
                    onChange={(event) => set("phone", event.target.value)}
                    aria-invalid={invalid("phone")}
                  />
                  <FieldError>{errors.phone}</FieldError>
                </Field>
                <Field data-invalid={invalid("email")}>
                  <FieldLabel htmlFor="email">Email (optional)</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={values.email}
                    onChange={(event) => set("email", event.target.value)}
                    aria-invalid={invalid("email")}
                  />
                  <FieldError>{errors.email}</FieldError>
                </Field>
              </div>
              <Field data-invalid={invalid("address")}>
                <FieldLabel htmlFor="address">Delivery address</FieldLabel>
                <Input
                  id="address"
                  autoComplete="street-address"
                  value={values.address}
                  onChange={(event) => set("address", event.target.value)}
                  aria-invalid={invalid("address")}
                />
                <FieldError>{errors.address}</FieldError>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={invalid("city")}>
                  <FieldLabel htmlFor="city">City</FieldLabel>
                  <Input
                    id="city"
                    autoComplete="address-level2"
                    value={values.city}
                    onChange={(event) => set("city", event.target.value)}
                    aria-invalid={invalid("city")}
                  />
                  <FieldError>{errors.city}</FieldError>
                </Field>
                <Field data-invalid={invalid("state")}>
                  <FieldLabel htmlFor="state">State</FieldLabel>
                  <Select
                    items={STATE_ITEMS}
                    value={values.state === "" ? null : values.state}
                    onValueChange={(value) => set("state", value ?? "")}
                  >
                    <SelectTrigger
                      id="state"
                      className="w-full"
                      aria-invalid={invalid("state")}
                    >
                      <SelectValue placeholder="Choose your state" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATE_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{errors.state}</FieldError>
                </Field>
              </div>
              <Field data-invalid={invalid("note")}>
                <FieldLabel htmlFor="note">Order note (optional)</FieldLabel>
                <Textarea
                  id="note"
                  rows={3}
                  value={values.note}
                  onChange={(event) => set("note", event.target.value)}
                  aria-invalid={invalid("note")}
                />
                <FieldError>{errors.note}</FieldError>
              </Field>
            </FieldGroup>
          </section>

          <section aria-labelledby="payment" className="flex flex-col gap-4">
            <h2 id="payment" className="text-lg font-extrabold">
              Payment
            </h2>
            <RadioGroup
              value={method}
              onValueChange={(value) =>
                setMethod(value === "PAYSTACK" ? "PAYSTACK" : "WHATSAPP")
              }
              className="gap-3"
            >
              <label className="border-input flex cursor-pointer items-start gap-3 rounded-md border p-4 has-checked:border-primary">
                <RadioGroupItem
                  value="WHATSAPP"
                  id="pay-whatsapp"
                  className="mt-1"
                />
                <span>
                  <span className="block font-bold">
                    Pay after we confirm on WhatsApp
                  </span>
                  <span className="text-muted-foreground text-sm">
                    We confirm stock and send bank details or a payment link.
                  </span>
                </span>
              </label>
              {settings.paymentMethods.includes("PAYSTACK") ? (
                <label className="border-input flex cursor-pointer items-start gap-3 rounded-md border p-4 has-checked:border-primary">
                  <RadioGroupItem
                    value="PAYSTACK"
                    id="pay-card"
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-bold">
                      Pay with card or transfer
                    </span>
                    <span className="text-muted-foreground text-sm">
                      Secure payment with Paystack.
                    </span>
                  </span>
                </label>
              ) : null}
            </RadioGroup>
          </section>
        </div>

        <aside
          className="bg-muted h-fit rounded-lg p-6 lg:sticky lg:top-40"
          aria-label="Order summary"
        >
          <h2 className="mb-4 text-lg font-extrabold">Order summary</h2>
          <ul className="mb-4 flex flex-col gap-3">
            {lines.map((line) => (
              <li
                key={line.productId}
                className="flex justify-between gap-3 text-sm"
              >
                <span>
                  <span className="price font-bold">{line.quantity} ×</span>{" "}
                  {line.name}
                </span>
                <span className="price font-bold">
                  {formatNaira(line.price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="border-border flex flex-col gap-2 border-t pt-4">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="price font-bold">{formatNaira(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="price font-bold">
                {quote
                  ? quote.free
                    ? "Free"
                    : formatNaira(quote.fee)
                  : "Choose a state"}
              </dd>
            </div>
            {quote?.etaDays ? (
              <p className="text-muted-foreground text-sm">
                Usually {quote.etaDays}.
              </p>
            ) : null}
            <div className="border-border mt-2 flex justify-between border-t pt-3 text-lg">
              <dt className="font-extrabold">Total</dt>
              <dd className="price text-primary font-extrabold">
                {formatNaira(total)}
              </dd>
            </div>
          </dl>
          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full"
            disabled={submitting}
          >
            {submitting ? "Placing your order" : "Place order"}
          </Button>
          <FieldDescription className="mt-3 flex items-start gap-2">
            <LockIcon className="mt-0.5 size-4 shrink-0" />
            Prices and stock are checked again when you place the order. You
            will be taken to WhatsApp to send it to us.
          </FieldDescription>
        </aside>
      </form>
    </Container>
  );
}
