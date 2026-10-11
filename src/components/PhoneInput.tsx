"use client";

import { useState, useRef, useEffect } from "react";
import { countriesForSearch, phoneDigits, phoneLimit, readPhone, type PhoneDraft } from "@/lib/company-phone";

const fieldClass = "mt-1 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand";

export default function PhoneInput({ id, label, value, onChange, required = false }: {
  id: string; label: string; value: PhoneDraft; onChange: (value: PhoneDraft) => void; required?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const numberRef = useRef<HTMLInputElement>(null);
  useEffect(() => { numberRef.current?.setCustomValidity(inputError ?? ""); }, [inputError]);
  const options = countriesForSearch(query);
  // Keep the saved selection visible even while the user searches for another country.
  const selected = countriesForSearch("").find(c => c.code === value.country);
  const visible = selected && !options.some(c => c.code === selected.code) ? [selected, ...options] : options;

  function changeNumber(raw: string) {
    if (raw.trim().startsWith("+") || raw.trim().startsWith("00")) {
      const pasted = readPhone(raw);
      if (pasted.country && /^\d+$/.test(pasted.national) && pasted.national.length <= phoneLimit(pasted.country)) {
        onChange(pasted); setQuery(""); setInputError(null); return;
      }
      setInputError("Revisa el número internacional pegado; no se ha cambiado el número anterior.");
      return;
    }
    const national = phoneDigits(raw);
    if (national.length > phoneLimit(value.country)) {
      setInputError(`Máximo ${phoneLimit(value.country)} cifras para el país elegido. No se ha recortado el número.`);
      return;
    }
    setInputError(null);
    onChange({ ...value, national });
  }

  return <div className="space-y-3">
    <div>
      <label htmlFor={`${id}-search`} className="block text-xs text-slate-600">Buscar país para {label.toLowerCase()}</label>
      <input id={`${id}-search`} type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="México, España, ES, SP, +34…" className={fieldClass} />
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor={`${id}-country`} className="block text-sm font-medium text-slate-700">País y prefijo de {label.toLowerCase()}</label>
        <select id={`${id}-country`} value={value.country} required={required || !!value.national} onChange={e => { onChange({ ...value, country: e.target.value as PhoneDraft["country"] }); setInputError(null); }} className={fieldClass}>
          <option value="">Elige un país y prefijo</option>
          {visible.map(country => <option key={country.code} value={country.code}>{country.name} ({country.code}) {country.prefix}</option>)}
        </select>
        {options.length === 0 && <p className="mt-1 text-xs text-slate-600">No hay países con esa búsqueda.</p>}
      </div>
      <div>
        <label htmlFor={`${id}-number`} className="block text-sm font-medium text-slate-700">Número de {label.toLowerCase()}</label>
        <input ref={numberRef} id={`${id}-number`} type="tel" inputMode="numeric" autoComplete="tel-national" value={value.national} required={required} pattern={value.country === "MX" ? "[0-9]{10}" : "[0-9]+"} onChange={e => changeNumber(e.target.value)} aria-describedby={`${id}-help`} className={fieldClass} />
      </div>
    </div>
    <p id={`${id}-help`} className="text-xs text-slate-600">{value.country === "MX" ? "10 cifras, sin repetir +52." : "Solo cifras, sin repetir el prefijo del país."}</p>
    {inputError && <p role="alert" className="text-sm text-red-700">{inputError}</p>}
  </div>;
}
