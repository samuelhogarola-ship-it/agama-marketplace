export const SALE_UNITS = [
  { value: "unidad", label: "Unidad" },
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
] as const;

export type SaleUnit = (typeof SALE_UNITS)[number]["value"];

export function isSaleUnit(value: string): value is SaleUnit {
  return SALE_UNITS.some((unit) => unit.value === value);
}

export function parseMinimumPurchase(value: FormDataEntryValue | string | undefined | null) {
  const parsed = Number(String(value ?? "").trim());
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}
