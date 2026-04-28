type MaybeNumber = string | number | null | undefined;

export const cnyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 2
});

export function formatCny(value: MaybeNumber) {
  const number = Number(value ?? 0);
  return cnyFormatter.format(Number.isFinite(number) ? number : 0);
}

export function formatPercent(value: MaybeNumber) {
  const number = Number(value ?? 0);
  return `${(Number.isFinite(number) ? number : 0).toFixed(2)}%`;
}

export function formatDateTime(value?: string | null) {
  if (!value) return "No timestamp";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function rowsFrom<T>(payload: T[] | { results?: T[] } | null | undefined): T[] {
  if (!payload) return [];
  return Array.isArray(payload) ? payload : payload.results ?? [];
}
