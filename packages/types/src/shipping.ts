export interface ShippingRateInfo {
  state: string;
  fee: number;
  etaDays: string | null;
}

export interface ShippingQuote {
  fee: number;
  etaDays: string | null;
  free: boolean;
}

export function calculateShipping(input: {
  subtotal: number;
  state: string;
  rates: readonly ShippingRateInfo[];
  defaultFee: number;
  freeShippingOver: number | null;
}): ShippingQuote {
  const rate = input.rates.find((entry) => entry.state === input.state);
  const free =
    input.freeShippingOver !== null && input.subtotal >= input.freeShippingOver;
  return {
    fee: free ? 0 : (rate?.fee ?? input.defaultFee),
    etaDays: rate?.etaDays ?? null,
    free,
  };
}
