export function getCurrencySymbol(currencyCode: string): string {
  const symbols: { [key: string]: string } = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CAD: "C$",
    AUD: "A$",
    INR: "₹",
  };
  return symbols[currencyCode] || "$";
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  const locale = currencyCode === "INR" ? "en-IN" : undefined;
  
  // Format with thousands separator (and Indian style lakhs/crores formatting if INR)
  const formattedAmount = Math.abs(amount).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${amount < 0 ? "-" : ""}${symbol}${formattedAmount}`;
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}
