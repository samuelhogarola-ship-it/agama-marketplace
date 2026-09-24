"use client";

import PhoneInput from "@/components/PhoneInput";
import type { ContactDraft, ContactSelection } from "@/lib/company-phone";

export default function CompanyContactFields({ enabled, value, onToggle, onChange }: {
  enabled: ContactSelection; value: ContactDraft;
  onToggle: (enabled: ContactSelection) => void; onChange: (value: ContactDraft) => void;
}) {
  return <fieldset className="space-y-4">
    <legend className="text-base font-semibold text-brand-dark">¿Cómo pueden contactar con tu empresa?</legend>
    <p className="text-sm text-slate-600">Activa y completa al menos una opción. Puedes usar una, dos o las tres.</p>
    <div className="rounded-xl border border-slate-200 p-4">
      <label className="flex items-center gap-3 font-semibold text-slate-700">
        <input type="checkbox" checked={enabled.phone} onChange={e => onToggle({ ...enabled, phone: e.target.checked })} className="h-4 w-4 accent-brand" />
        Contacto por teléfono
      </label>
      {enabled.phone && <div className="mt-4"><PhoneInput id="company-phone" label="Teléfono" value={value.phone} onChange={phone => onChange({ ...value, phone })} required /></div>}
    </div>
    <div className="rounded-xl border border-slate-200 p-4">
      <label className="flex items-center gap-3 font-semibold text-slate-700">
        <input type="checkbox" checked={enabled.email} onChange={e => onToggle({ ...enabled, email: e.target.checked })} className="h-4 w-4 accent-brand" />
        Contacto por correo electrónico
      </label>
      {enabled.email && <div className="mt-4">
        <label htmlFor="company-email" className="block text-sm font-medium text-slate-700">Correo electrónico público</label>
        <input id="company-email" type="email" required autoComplete="email" value={value.email} onChange={e => onChange({ ...value, email: e.target.value })} placeholder="ventas@tuempresa.com" className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand" />
      </div>}
    </div>
    <div className="rounded-xl border border-slate-200 p-4">
      <label className="flex items-center gap-3 font-semibold text-slate-700">
        <input type="checkbox" checked={enabled.whatsapp} onChange={e => onToggle({ ...enabled, whatsapp: e.target.checked })} className="h-4 w-4 accent-brand" />
        Contacto por WhatsApp
      </label>
      {enabled.whatsapp && <div className="mt-4"><PhoneInput id="company-whatsapp" label="WhatsApp" value={value.whatsapp} onChange={whatsapp => onChange({ ...value, whatsapp })} required /></div>}
    </div>
    <p className="text-xs text-slate-500">Solo se mostrarán públicamente las opciones que dejes activadas al guardar.</p>
  </fieldset>;
}
