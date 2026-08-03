import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

type FilterValue = string | undefined;

type Props = {
  category: string;
  subcategory: FilterValue;
  location: FilterValue;
  date: FilterValue;
  type: FilterValue;
  minPrice: FilterValue;
  maxPrice: FilterValue;
  sort: FilterValue;
};

const CATEGORY_SUBCATEGORIES: Record<string, readonly (readonly [string, string])[]> = {
  "envases-y-botellas": [["botellas", "Botellas"], ["frascos", "Frascos"], ["tapas", "Tapas"], ["contenedores", "Contenedores"]],
  "bolsas-y-pelicula": [["bolsas", "Bolsas"], ["pelicula-stretch", "Película stretch"], ["playo", "Playo"], ["sacos", "Sacos"]],
  "tarimas-y-contenedores": [["tarimas", "Tarimas"], ["cajas-industriales", "Cajas industriales"], ["contenedores-apilables", "Contenedores apilables"]],
  "cubetas-y-bidones": [["cubetas", "Cubetas"], ["bidones", "Bidones"], ["tambos", "Tambos"], ["garrafones", "Garrafones"]],
  "perfiles-y-laminas": [["perfiles", "Perfiles"], ["laminas", "Láminas"], ["placas", "Placas"], ["planchas", "Planchas"]],
  "tuberia-y-conexiones": [["pvc", "PVC"], ["pead", "PEAD"], ["cpvc", "CPVC"], ["conexiones", "Conexiones"]],
};

const dateOptions = [
  ["today", "Hoy"],
  ["7d", "Últimos 7 días"],
  ["30d", "Últimos 30 días"],
] as const;

const typeOptions = [
  ["product", "Producto"],
  ["service", "Servicio"],
  ["ad", "Anuncio B2B"],
] as const;

function withParam(category: string, current: URLSearchParams, key: string, value?: string) {
  const params = new URLSearchParams(current.toString());
  if (value) params.set(key, value);
  else params.delete(key);
  return `/c/${category}${params.toString() ? `?${params.toString()}` : ""}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="border-b border-slate-200 py-5 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-brand-dark marker:hidden">
        {title}
        <span aria-hidden="true" className="text-lg font-normal text-slate-400">⌄</span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

function RadioList({
  category,
  current,
  name,
  options,
  selected,
}: {
  category: string;
  current: URLSearchParams;
  name: string;
  options: readonly (readonly [string, string])[];
  selected?: string;
}) {
  return (
    <div className="space-y-3">
      <Link href={withParam(category, current, name)} className={`block text-sm ${!selected ? "font-semibold text-brand-dark" : "text-slate-600 hover:text-hot"}`}>
        Cualquiera
      </Link>
      {options.map(([value, label]) => (
        <Link
          key={value}
          href={withParam(category, current, name, value)}
          className={`block text-sm ${selected === value ? "font-semibold text-brand-dark" : "text-slate-600 hover:text-hot"}`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

export default function CategoryFilters({ category, subcategory, location, date, type, minPrice, maxPrice, sort }: Props) {
  const current = new URLSearchParams();
  if (subcategory) current.set("subcategory", subcategory);
  if (location) current.set("location", location);
  if (date) current.set("date", date);
  if (type) current.set("type", type);
  if (minPrice) current.set("minPrice", minPrice);
  if (maxPrice) current.set("maxPrice", maxPrice);
  if (sort) current.set("sort", sort);

  const activeCount = [subcategory, location, date, type, minPrice, maxPrice].filter(Boolean).length;
  const subcategories = CATEGORY_SUBCATEGORIES[category] ?? [];

  return (
    <aside className="h-fit lg:sticky lg:top-28">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 shadow-[0_12px_35px_rgba(20,18,81,0.06)]">
        <div className="flex items-center justify-between border-b border-slate-200 py-5">
          <p className="text-sm font-semibold text-brand-dark">Filtros</p>
          {activeCount > 0 ? (
            <Link href={`/c/${category}`} className="text-xs font-semibold text-hot hover:underline">
              Limpiar
            </Link>
          ) : null}
        </div>

        <Section title="Categorías">
          <div className="space-y-3">
            <Link href="/categorias" className="block text-sm font-semibold text-brand-dark">Todas las categorías</Link>
            {CATEGORIES.map((item) => (
              <Link
                key={item.slug}
                href={`/c/${item.slug}`}
                className={`block text-sm ${item.slug === category ? "font-semibold text-brand" : "text-slate-600 hover:text-hot"}`}
              >
                {item.name}
              </Link>
            ))}
            {subcategories.length > 0 ? (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">En {CATEGORIES.find((item) => item.slug === category)?.name}</p>
                <div className="space-y-3 pl-3">
                  <Link href={withParam(category, current, "subcategory")} className={`block text-sm ${!subcategory ? "font-semibold text-brand-dark" : "text-slate-600 hover:text-hot"}`}>Ver todo</Link>
                  {subcategories.map(([value, label]) => (
                    <Link key={value} href={withParam(category, current, "subcategory", value)} className={`block text-sm ${subcategory === value ? "font-semibold text-brand" : "text-slate-600 hover:text-hot"}`}>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Section>

        <Section title="Ubicación">
          <form action={`/c/${category}`} className="flex gap-2">
            {date && <input type="hidden" name="date" value={date} />}
            {type && <input type="hidden" name="type" value={type} />}
            {subcategory && <input type="hidden" name="subcategory" value={subcategory} />}
            {minPrice && <input type="hidden" name="minPrice" value={minPrice} />}
            {maxPrice && <input type="hidden" name="maxPrice" value={maxPrice} />}
            {sort && <input type="hidden" name="sort" value={sort} />}
            <label htmlFor="category-location" className="sr-only">Ciudad o estado</label>
            <input id="category-location" name="location" defaultValue={location} placeholder="Ciudad o estado" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand" />
            <button className="rounded-lg bg-brand-dark px-3 text-xs font-semibold text-white hover:bg-brand">Aplicar</button>
          </form>
        </Section>

        <Section title="Fecha de publicación">
          <RadioList category={category} current={current} name="date" options={dateOptions} selected={date} />
        </Section>

        <Section title="Precio MXN">
          <form action={`/c/${category}`} className="grid grid-cols-2 gap-2">
            {location && <input type="hidden" name="location" value={location} />}
            {date && <input type="hidden" name="date" value={date} />}
            {type && <input type="hidden" name="type" value={type} />}
            {subcategory && <input type="hidden" name="subcategory" value={subcategory} />}
            {sort && <input type="hidden" name="sort" value={sort} />}
            <label className="text-xs text-slate-500">Mínimo<input name="minPrice" type="number" min="0" defaultValue={minPrice} placeholder="0" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand" /></label>
            <label className="text-xs text-slate-500">Máximo<input name="maxPrice" type="number" min="0" defaultValue={maxPrice} placeholder="Sin límite" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand" /></label>
            <button className="col-span-2 mt-1 rounded-lg border border-brand-dark px-3 py-2 text-xs font-semibold text-brand-dark hover:bg-brand-light">Aplicar precio</button>
          </form>
        </Section>

        <Section title="Tipo de publicación">
          <RadioList category={category} current={current} name="type" options={typeOptions} selected={type} />
        </Section>
      </div>
    </aside>
  );
}
