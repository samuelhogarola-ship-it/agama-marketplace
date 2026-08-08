export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-20 text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand" />
      <p className="mt-4 text-sm text-slate-500">Cargando…</p>
    </div>
  );
}
