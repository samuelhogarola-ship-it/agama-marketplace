/**
 * Spinner de carga entre rutas.
 *
 * Ojo dónde se usa: un `loading.tsx` abre un límite de Suspense y hace que Next
 * vuelque la cabecera antes de renderizar el contenido. A partir de ahí el
 * status ya está fijado en 200, así que cualquier `notFound()` o `redirect()`
 * posterior pinta su UI pero no puede cambiar el código HTTP.
 *
 * Por eso NO debe haber `loading.tsx` en la raíz ni en segmentos que contengan
 * rutas con `notFound()` / `redirect()` de servidor — hoy `/c/[categoria]`,
 * `/p/[slug]`, `/e/[slug]` y `/articulos/[slug]`.
 */
export default function RouteLoading() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-20 text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand" />
      <p className="mt-4 text-sm text-slate-500">Cargando…</p>
    </div>
  );
}
