const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const usdDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatPrice(cents: number): string {
  return usd.format(cents / 100);
}

export function formatDate(date: Date): string {
  return usdDate.format(date);
}
