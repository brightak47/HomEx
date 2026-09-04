const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  GHS: "GH₵",
  NGN: "₦",
};

export function formatMoney(cents: number, currency = "USD"): string {
  const symbol = currencySymbols[currency] ?? `${currency} `;
  return `${symbol}${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function parsePriceToCents(value: string | number): number {
  const amount = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Enter a valid ticket price");
  }
  return Math.round(amount * 100);
}
