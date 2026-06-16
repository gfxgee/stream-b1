// Formats a price with Norwegian-style thousands grouping, e.g. "60 000 NOK".
export function formatPrice(amount: number, currency: string): string {
  const n = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 }).format(
    Math.round(amount)
  );
  return `${n} ${currency}`;
}
