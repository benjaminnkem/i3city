"use client";

import {
  NIGERIA_STATES,
  formatNaira,
  stateLabel,
  type AdminSettings,
  type ShippingRateInfo,
} from "@repo/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { notifyError } from "@/lib/admin/errors";
import {
  deliveryFormSchema,
  getRates,
  getSettings,
  rateRowSchema,
  saveRates,
  saveSettings,
  settingsKeys,
} from "@/lib/admin/settings";
import { toApiError } from "@/lib/api";

interface RateDraft {
  fee: string;
  etaDays: string;
}

function DeliveryDefaults({ settings }: Readonly<{ settings: AdminSettings }>) {
  const queryClient = useQueryClient();
  const [fee, setFee] = useState(String(settings.defaultShippingFee));
  const [free, setFree] = useState(
    settings.freeShippingOver === null ? "" : String(settings.freeShippingOver),
  );
  const [errors, setErrors] = useState<{ fee?: string; free?: string }>({});

  const save = useMutation({
    mutationFn: (values: { fee: number; free: number | null }) =>
      saveSettings({
        storeName: settings.storeName,
        whatsappNumber: settings.whatsappNumber,
        supportEmail: settings.supportEmail,
        address: settings.address,
        openingHours: settings.openingHours,
        bankDetails: settings.bankDetails,
        defaultShippingFee: values.fee,
        freeShippingOver: values.free,
      }),
    onSuccess: (saved) => {
      queryClient.setQueryData(settingsKeys.settings, saved);
      toast.success("Delivery settings saved");
    },
    onError: notifyError,
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = deliveryFormSchema.safeParse({
      defaultShippingFee: fee,
      freeShippingOver: free,
    });
    if (!parsed.success) {
      const next: { fee?: string; free?: string } = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "defaultShippingFee") next.fee = issue.message;
        if (issue.path[0] === "freeShippingOver") next.free = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    save.mutate({
      fee: parsed.data.defaultShippingFee,
      free:
        parsed.data.freeShippingOver === ""
          ? null
          : Number(parsed.data.freeShippingOver),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Defaults</CardTitle>
        <CardDescription>
          Used when a state has no rate, and to offer free delivery on bigger
          orders.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          noValidate
          className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-start"
        >
          <Field data-invalid={errors.fee ? true : undefined}>
            <FieldLabel htmlFor="default-fee">Default delivery fee</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>₦</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="default-fee"
                inputMode="numeric"
                value={fee}
                onChange={(event) => setFee(event.target.value)}
                aria-invalid={errors.fee ? true : undefined}
              />
            </InputGroup>
            <FieldError>{errors.fee}</FieldError>
          </Field>
          <Field data-invalid={errors.free ? true : undefined}>
            <FieldLabel htmlFor="free-over">Free delivery over</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>₦</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="free-over"
                inputMode="numeric"
                placeholder="No free delivery"
                value={free}
                onChange={(event) => setFree(event.target.value)}
                aria-invalid={errors.free ? true : undefined}
              />
            </InputGroup>
            <FieldDescription>
              Leave empty to always charge delivery.
            </FieldDescription>
            <FieldError>{errors.free}</FieldError>
          </Field>
          <Button type="submit" className="sm:mt-6" disabled={save.isPending}>
            {save.isPending ? "Saving" : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function RatesEditor({ rates }: Readonly<{ rates: ShippingRateInfo[] }>) {
  const queryClient = useQueryClient();
  const initial = useMemo(
    () =>
      Object.fromEntries(
        NIGERIA_STATES.map((state) => {
          const rate = rates.find((entry) => entry.state === state);
          return [
            state,
            { fee: String(rate?.fee ?? 0), etaDays: rate?.etaDays ?? "" },
          ];
        }),
      ) as Record<string, RateDraft>,
    [rates],
  );
  const [drafts, setDrafts] = useState(initial);
  const [bulk, setBulk] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dirty = NIGERIA_STATES.filter(
    (state) =>
      drafts[state]?.fee !== initial[state]?.fee ||
      drafts[state]?.etaDays !== initial[state]?.etaDays,
  );

  const save = useMutation({
    mutationFn: saveRates,
    onSuccess: (saved) => {
      queryClient.setQueryData(settingsKeys.rates, saved);
      toast.success("Delivery rates saved");
    },
    onError: notifyError,
  });

  function setField(state: string, field: keyof RateDraft, value: string) {
    setDrafts((current) => ({
      ...current,
      [state]: {
        ...(current[state] ?? { fee: "0", etaDays: "" }),
        [field]: value,
      },
    }));
  }

  function applyBulk() {
    if (!/^\d+$/.test(bulk.trim())) {
      toast.error("Enter a whole number for the fee");
      return;
    }
    setDrafts((current) =>
      Object.fromEntries(
        Object.entries(current).map(([state, draft]) => [
          state,
          { ...draft, fee: bulk.trim() },
        ]),
      ),
    );
  }

  function onSave() {
    const nextErrors: Record<string, string> = {};
    const payload: ShippingRateInfo[] = [];
    for (const state of NIGERIA_STATES) {
      const draft = drafts[state];
      const parsed = rateRowSchema.safeParse({
        state,
        fee: draft?.fee ?? "",
        etaDays: draft?.etaDays ?? "",
      });
      if (!parsed.success) {
        nextErrors[state] = parsed.error.issues[0]?.message ?? "Check this row";
      } else {
        payload.push({
          state,
          fee: parsed.data.fee,
          etaDays: parsed.data.etaDays === "" ? null : parsed.data.etaDays,
        });
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Check the highlighted rows");
      return;
    }
    save.mutate(payload);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rates by state</CardTitle>
        <CardDescription>
          The delivery fee and the time customers see at checkout.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-2">
          <Field className="w-48">
            <FieldLabel htmlFor="bulk-fee">Set every fee to</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>₦</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="bulk-fee"
                inputMode="numeric"
                value={bulk}
                onChange={(event) => setBulk(event.target.value)}
              />
            </InputGroup>
          </Field>
          <Button type="button" variant="outline" onClick={applyBulk}>
            Apply to all
          </Button>
        </div>

        <div className="border-border overflow-hidden rounded-md border">
          <table className="w-full text-left">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Delivery time</th>
              </tr>
            </thead>
            <tbody>
              {NIGERIA_STATES.map((state) => (
                <tr key={state} className="border-border border-t">
                  <td className="px-4 py-2 font-bold">
                    {stateLabel(state)}
                    {errors[state] ? (
                      <span className="text-destructive block text-sm font-normal">
                        {errors[state]}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      aria-label={`Fee for ${stateLabel(state)}`}
                      inputMode="numeric"
                      className="price w-32"
                      value={drafts[state]?.fee ?? ""}
                      onChange={(event) =>
                        setField(state, "fee", event.target.value)
                      }
                      aria-invalid={errors[state] ? true : undefined}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      aria-label={`Delivery time for ${stateLabel(state)}`}
                      placeholder="3 to 5 days"
                      className="w-44"
                      value={drafts[state]?.etaDays ?? ""}
                      onChange={(event) =>
                        setField(state, "etaDays", event.target.value)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-border bg-background sticky bottom-0 -mx-6 flex items-center justify-between gap-3 border-t px-6 py-3">
          <span className="text-muted-foreground text-sm">
            {dirty.length === 0
              ? "No changes"
              : `${dirty.length} ${dirty.length === 1 ? "state" : "states"} changed`}
          </span>
          <Button
            disabled={dirty.length === 0 || save.isPending}
            onClick={onSave}
          >
            {save.isPending ? "Saving" : "Save rates"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ShippingView() {
  const settings = useQuery({
    queryKey: settingsKeys.settings,
    queryFn: getSettings,
  });
  const rates = useQuery({ queryKey: settingsKeys.rates, queryFn: getRates });
  const failed = settings.isError || rates.isError;
  return (
    <>
      <PageHeader
        title="Delivery"
        description={`Set what delivery costs in each state. Example: ${formatNaira(3500)} for Lagos.`}
      />
      {failed ? (
        <Alert>
          <AlertTitle>Could not load delivery rates</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            {toApiError(settings.error ?? rates.error).message}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void settings.refetch();
                void rates.refetch();
              }}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : settings.data && rates.data ? (
        <div className="flex max-w-4xl flex-col gap-6">
          <DeliveryDefaults
            key={JSON.stringify([
              settings.data.defaultShippingFee,
              settings.data.freeShippingOver,
            ])}
            settings={settings.data}
          />
          <RatesEditor key={JSON.stringify(rates.data)} rates={rates.data} />
        </div>
      ) : (
        <Skeleton className="h-96 max-w-4xl rounded-md" />
      )}
    </>
  );
}
