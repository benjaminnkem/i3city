const nairaFormat = new Intl.NumberFormat("en-NG", {
  maximumFractionDigits: 0,
});

export function formatNaira(amount: number): string {
  return `₦${nairaFormat.format(amount)}`;
}
