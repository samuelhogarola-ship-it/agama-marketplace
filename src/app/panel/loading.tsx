export default function PanelLoading() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12">
      <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-10 w-72 animate-pulse rounded bg-slate-200" />
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
