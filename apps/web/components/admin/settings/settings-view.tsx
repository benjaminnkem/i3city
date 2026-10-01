"use client";

import { isPlaceholderWhatsApp, type AdminSettings } from "@repo/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { notifyError } from "@/lib/admin/errors";
import {
  getSettings,
  saveSettings,
  settingsKeys,
  storeFormSchema,
} from "@/lib/admin/settings";
import { toApiError } from "@/lib/api";

interface FormState {
  storeName: string;
  whatsappNumber: string;
  supportEmail: string;
  address: string;
  openingHours: string;
  bankDetails: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

function SettingsForm({ settings }: Readonly<{ settings: AdminSettings }>) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<FormState>({
    storeName: settings.storeName,
    whatsappNumber: settings.whatsappNumber,
    supportEmail: settings.supportEmail ?? "",
    address: settings.address ?? "",
    openingHours: settings.openingHours ?? "",
    bankDetails: settings.bankDetails ?? "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [paystackEnabled, setPaystackEnabled] = useState(
    settings.paystackEnabled,
  );

  const save = useMutation({
    mutationFn: (values: FormState) =>
      saveSettings({
        storeName: values.storeName.trim(),
        whatsappNumber: values.whatsappNumber.trim(),
        supportEmail: values.supportEmail.trim() || null,
        address: values.address.trim() || null,
        openingHours: values.openingHours.trim() || null,
        bankDetails: values.bankDetails.trim() || null,
        defaultShippingFee: settings.defaultShippingFee,
        freeShippingOver: settings.freeShippingOver,
        paystackEnabled,
      }),
    onSuccess: async (saved) => {
      queryClient.setQueryData(settingsKeys.settings, saved);
      toast.success("Settings saved");
    },
    onError: notifyError,
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = storeFormSchema.safeParse(state);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormState | undefined;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error("Check the highlighted fields");
      return;
    }
    setErrors({});
    save.mutate(state);
  }

  const invalid = (key: keyof FormState) => (errors[key] ? true : undefined);

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex max-w-3xl flex-col gap-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Store details</CardTitle>
          <CardDescription>
            Shown to customers in the store footer and on order messages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={invalid("storeName")}>
              <FieldLabel htmlFor="storeName">Store name</FieldLabel>
              <Input
                id="storeName"
                value={state.storeName}
                onChange={(event) => set("storeName", event.target.value)}
                aria-invalid={invalid("storeName")}
              />
              <FieldError>{errors.storeName}</FieldError>
            </Field>
            <Field data-invalid={invalid("address")}>
              <FieldLabel htmlFor="address">Store address</FieldLabel>
              <Input
                id="address"
                value={state.address}
                onChange={(event) => set("address", event.target.value)}
                aria-invalid={invalid("address")}
              />
              <FieldError>{errors.address}</FieldError>
            </Field>
            <Field data-invalid={invalid("openingHours")}>
              <FieldLabel htmlFor="openingHours">Opening hours</FieldLabel>
              <Input
                id="openingHours"
                value={state.openingHours}
                onChange={(event) => set("openingHours", event.target.value)}
                aria-invalid={invalid("openingHours")}
              />
              <FieldError>{errors.openingHours}</FieldError>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
          <CardDescription>
            Customers message this WhatsApp number to send their orders. Changes
            apply to the store straight away.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={invalid("whatsappNumber")}>
              <FieldLabel htmlFor="whatsappNumber">WhatsApp number</FieldLabel>
              <Input
                id="whatsappNumber"
                type="tel"
                inputMode="numeric"
                placeholder="0801 234 5678"
                value={state.whatsappNumber}
                onChange={(event) => set("whatsappNumber", event.target.value)}
                aria-invalid={invalid("whatsappNumber")}
              />
              <FieldDescription>
                {isPlaceholderWhatsApp(settings.whatsappNumber)
                  ? "This is still a placeholder. Enter your real number so customers can reach you."
                  : "Saved in international format, for example 2348012345678."}
              </FieldDescription>
              <FieldError>{errors.whatsappNumber}</FieldError>
            </Field>
            <Field data-invalid={invalid("supportEmail")}>
              <FieldLabel htmlFor="supportEmail">Support email</FieldLabel>
              <Input
                id="supportEmail"
                type="email"
                value={state.supportEmail}
                onChange={(event) => set("supportEmail", event.target.value)}
                aria-invalid={invalid("supportEmail")}
              />
              <FieldDescription>
                New order notifications are sent here.
              </FieldDescription>
              <FieldError>{errors.supportEmail}</FieldError>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>How customers pay.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={invalid("bankDetails")}>
              <FieldLabel htmlFor="bankDetails">
                Bank transfer details
              </FieldLabel>
              <Textarea
                id="bankDetails"
                rows={4}
                placeholder={"Bank name\nAccount number\nAccount name"}
                value={state.bankDetails}
                onChange={(event) => set("bankDetails", event.target.value)}
                aria-invalid={invalid("bankDetails")}
              />
              <FieldDescription>
                Included in the "Payment details" WhatsApp message on each
                order.
              </FieldDescription>
              <FieldError>{errors.bankDetails}</FieldError>
            </Field>
            <Field orientation="horizontal">
              <Switch
                id="paystack"
                checked={paystackEnabled}
                disabled={!settings.paystackConfigured}
                onCheckedChange={setPaystackEnabled}
              />
              <div className="flex flex-col gap-0.5">
                <FieldLabel htmlFor="paystack">
                  Card and transfer with Paystack
                </FieldLabel>
                <FieldDescription>
                  {settings.paystackConfigured
                    ? "Customers can pay by card or transfer at checkout, and unpaid WhatsApp orders get a pay link. Orders are confirmed automatically when payment arrives."
                    : "Add PAYSTACK_SECRET_KEY to the API server to turn this on. Orders are confirmed on WhatsApp until then."}
                </FieldDescription>
              </div>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div>
        <Button type="submit" size="lg" disabled={save.isPending}>
          {save.isPending ? "Saving" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}

export function SettingsView() {
  const settings = useQuery({
    queryKey: settingsKeys.settings,
    queryFn: getSettings,
  });
  return (
    <>
      <PageHeader
        title="Settings"
        description="Your store details, contact and payment information."
      />
      {settings.isError ? (
        <Alert>
          <AlertTitle>Could not load settings</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            {toApiError(settings.error).message}
            <Button
              size="sm"
              variant="outline"
              onClick={() => settings.refetch()}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : settings.data ? (
        <SettingsForm
          key={JSON.stringify(settings.data)}
          settings={settings.data}
        />
      ) : (
        <Skeleton className="h-96 max-w-3xl rounded-md" />
      )}
    </>
  );
}
