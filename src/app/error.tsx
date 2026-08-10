"use client";

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-5 py-20 text-center">
      <h2 className="text-2xl font-semibold text-brand-dark">Algo salió mal</h2>
      <p className="mt-3 text-sm text-slate-600">
        Ocurrió un error inesperado. Puedes intentar recargar la página.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Reintentar
      </button>
    </div>
  );
}
