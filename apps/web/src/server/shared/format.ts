export const formatCategory = (value: string) =>
  value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

export const formatStatus = (value: string) =>
  value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

export const toCurrency = (amountInCents: number) =>
  new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 0,
  }).format(amountInCents / 100);

export const toDateTimeLocalValue = (isoValue: string | null) => {
  if (!isoValue) {
    return "";
  }

  const date = new Date(isoValue);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
