import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export type PhoneDraft = { country: CountryCode | ""; national: string };
const names = new Intl.DisplayNames(["es"], { type: "region" });
const common: CountryCode[] = ["MX", "US", "CA", "ES", "CO", "AR", "CL", "PE", "BR", "GT", "CN"];
const searchText = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
const countries = getCountries().map(code => ({ code, name: names.of(code) ?? code, prefix: `+${getCountryCallingCode(code)}` }))
  .sort((a, b) => {
    const ai = common.indexOf(a.code), bi = common.indexOf(b.code);
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || a.name.localeCompare(b.name, "es");
  });

export function countriesForSearch(query: string) {
  const q = searchText(query);
  if (!q) return countries;
  const aliases: Record<string, CountryCode> = { sp: "ES", esp: "ES", mx: "MX", usa: "US", eeuu: "US", "ee. uu.": "US" };
  const exact = aliases[q] ?? countries.find(c => c.code.toLowerCase() === q)?.code;
  if (exact) return countries.filter(c => c.code === exact);
  return countries.filter(c => searchText(`${c.name} ${c.code} ${c.prefix}`).includes(q));
}

export function phoneDigits(value: string) { return value.replace(/[^0-9]/g, ""); }
export function phoneLimit(country: PhoneDraft["country"]) {
  if (country === "MX") return 10;
  if (country === "ES") return 9;
  return country ? 15 - getCountryCallingCode(country).length : 15;
}

export function readPhone(value: string | null | undefined): PhoneDraft {
  const raw = value?.trim() ?? "";
  if (!raw) return { country: "", national: "" };
  // Never guess Mexico for an old value that has no explicit international prefix.
  if (!raw.startsWith("+") && !raw.startsWith("00")) return { country: "", national: raw };
  const parsed = parsePhoneNumberFromString(raw.startsWith("00") ? `+${raw.slice(2)}` : raw);
  if (!parsed?.country || parsed.ext) return { country: "", national: raw };
  return { country: parsed.country, national: parsed.nationalNumber };
}

export function phoneError(value: PhoneDraft, required = false): string | null {
  if (!value.national && !required) return null;
  if (!value.country) return "Elige el país y prefijo.";
  if (!/^[0-9]+$/.test(value.national)) return "Escribe el número usando solo cifras, sin el prefijo.";
  if (value.country === "MX" && value.national.length !== 10) return "El número de México debe tener 10 cifras, sin +52.";
  if (value.national.length > phoneLimit(value.country)) return "El número tiene demasiadas cifras para el país elegido.";
  const parsed = parsePhoneNumberFromString(`+${getCountryCallingCode(value.country)}${value.national}`);
  if (!parsed?.isPossible()) return "Revisa la cantidad de cifras del número para el país elegido.";
  return null;
}

export function phoneValue(value: PhoneDraft): string {
  if (!value.national) return "";
  const error = phoneError(value);
  if (error) throw new Error(error);
  return parsePhoneNumberFromString(`+${getCountryCallingCode(value.country as CountryCode)}${value.national}`)!.number;
}
