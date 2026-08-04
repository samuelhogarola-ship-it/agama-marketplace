export const SALE_UNITS = [
  { value: "unidad", label: "Unidad" },
  { value: "pieza", label: "Pieza" },
  { value: "caja", label: "Caja" },
  { value: "paquete", label: "Paquete" },
  { value: "rollo", label: "Rollo" },
  { value: "saco", label: "Saco" },
  { value: "kg", label: "kg" },
  { value: "ton", label: "Tonelada" },
  { value: "g", label: "g" },
  { value: "litro", label: "Litro" },
  { value: "metro", label: "Metro lineal" },
  { value: "m2", label: "m²" },
] as const;

export type SaleUnit = (typeof SALE_UNITS)[number]["value"];

export function isSaleUnit(value: string): value is SaleUnit {
  return SALE_UNITS.some((unit) => unit.value === value);
}

export function parseMinimumPurchase(value: FormDataEntryValue | string | undefined | null) {
  const parsed = Number(String(value ?? "").trim());
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}
