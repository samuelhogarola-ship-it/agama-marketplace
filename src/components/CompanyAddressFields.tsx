"use client";
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { postalInput, type CompanyAddress, type PostalZone } from '@/lib/company-address';

type Props = { value: CompanyAddress; onChange: Dispatch<SetStateAction<CompanyAddress>>; previousLocation?: string };
const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand';
export default function CompanyAddressFields({ value, onChange, previousLocation }: Props) {
  const [lookup, setLookup] = useState<{ code: string; zones: PostalZone[]; status: 'loading' | 'ready' | 'unavailable' }>({ code: '', zones: [], status: 'ready' });
  const [manual, setManual] = useState(false);
  useEffect(() => {
    const code = value.postalCode;
    if (!/^[0-9]{5}$/.test(code)) return;
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 5000);
    fetch(`/api/codigos-postales?cp=${code}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('lookup');
        return response.json() as Promise<{ zones: PostalZone[] }>;
      }).then(({ zones }) => {
        if (!active) return;
        setLookup({ code, zones, status: 'ready' });
        if (zones.length === 1) onChange(current => {
          if (current.postalCode !== code || current.state || current.municipality || current.colony) return current;
          const zone = zones[0];
          return { ...current, state: zone.state, municipality: zone.municipality, colony: zone.colonies.length === 1 ? zone.colonies[0] : '' };
        });
      }).catch(() => {
        if (active) setLookup({ code, zones: [], status: 'unavailable' });
      }).finally(() => clearTimeout(timeout));
    return () => { active = false; controller.abort(); clearTimeout(timeout); };
  }, [value.postalCode, onChange]);
  const matched = lookup.code === value.postalCode;
  const zones = matched ? lookup.zones : [];
  const loading = value.postalCode.length === 5 && (!matched || lookup.status === 'loading');
  const choices = zones.flatMap(zone => zone.colonies.map(colony => ({ state: zone.state, municipality: zone.municipality, colony })));
  const selected = choices.findIndex(choice => choice.state === value.state && choice.municipality === value.municipality && choice.colony === value.colony);
  const customSaved = Boolean(value.colony && selected === -1);
  const useManual = manual || !choices.length || customSaved;
  const change = (key: keyof CompanyAddress, text: string) => onChange(current => ({ ...current, [key]: text }));
  return <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4">
    <legend className="px-1 text-sm font-semibold text-brand-dark">Dirección de la empresa en México</legend>
    <p className="text-xs text-slate-600">Introduce tu código postal para completar la zona. En tu ficha pública solo se muestran el municipio y el estado.</p>
    {previousLocation && !value.postalCode && <p className="text-xs text-slate-600">Ubicación anterior: {previousLocation}. Completa los campos de la dirección.</p>}
    <div>
      <label htmlFor="address-postal" className="text-sm font-medium text-slate-700">Código postal *</label>
      <input id="address-postal" required inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}" title="Código postal de México: 5 cifras" value={value.postalCode} onChange={e => {
        const postalCode = postalInput(e.target.value);
        if (postalCode === value.postalCode) return;
        setManual(false);
        setLookup({ code: postalCode, zones: [], status: postalCode.length === 5 ? 'loading' : 'ready' });
        onChange(current => ({ ...current, postalCode, state: '', municipality: '', colony: '' }));
      }} className={inputClass} aria-describedby="address-postal-status"/>
      <p id="address-postal-status" role="status" className="mt-1 text-xs text-slate-600">{loading ? 'Buscando la zona…' : value.postalCode.length !== 5 ? '5 cifras; incluye el cero inicial si lo tiene.' : choices.length ? 'Zona encontrada. Revisa la colonia antes de guardar.' : 'No hemos encontrado la zona. Completa los campos manualmente.'}</p>
    </div>
    {!useManual && <div>
      <label htmlFor="address-colony-select" className="text-sm font-medium text-slate-700">Colonia o localidad *</label>
      <select id="address-colony-select" required value={selected < 0 ? '' : String(selected)} className={inputClass} onChange={e => {
        const choice = choices[Number(e.target.value)];
        if (e.target.value !== '' && choice) onChange(current => ({ ...current, ...choice }));
      }}><option value="">Elige tu colonia o localidad</option>{choices.map((choice, index) => <option key={index} value={index}>{choice.colony}{zones.length > 1 ? ` — ${choice.municipality}, ${choice.state}` : ''}</option>)}</select>
    </div>}
    <div className="grid gap-4 sm:grid-cols-2">
      {([['state', 'Estado', 'address-level1'], ['municipality', 'Municipio o alcaldía', 'address-level2'], ...(useManual ? [['colony', 'Colonia o localidad', 'address-level3']] : [])] as [keyof CompanyAddress, string, string][]).map(([key, label, autoComplete]) => <div key={key}>
        <label htmlFor={`address-${key}`} className="text-sm font-medium text-slate-700">{label} *</label>
        <input id={`address-${key}`} required maxLength={200} readOnly={!useManual} value={value[key]} autoComplete={autoComplete} onChange={e => change(key, e.target.value)} className={inputClass}/>
      </div>)}
    </div>
    {!!choices.length && !useManual && <button type="button" className="text-xs font-medium text-brand underline" onClick={() => setManual(true)}>Mi dirección no aparece: completar manualmente</button>}
    <div><label htmlFor="address-street" className="text-sm font-medium text-slate-700">Calle *</label><input id="address-street" required maxLength={200} autoComplete="address-line1" value={value.street} onChange={e => change('street', e.target.value)} className={inputClass}/></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div><label htmlFor="address-exterior" className="text-sm font-medium text-slate-700">Número exterior *</label><input id="address-exterior" required maxLength={200} placeholder="Ej. 15, 15A o S/N" value={value.exterior} onChange={e => change('exterior', e.target.value)} className={inputClass}/></div>
      <div><label htmlFor="address-interior" className="text-sm font-medium text-slate-700">Número interior (opcional)</label><input id="address-interior" maxLength={200} autoComplete="address-line2" value={value.interior} onChange={e => change('interior', e.target.value)} className={inputClass}/></div>
    </div>
  </fieldset>;
}
