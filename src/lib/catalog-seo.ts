export type SearchParams = Record<string, string | string[] | undefined>;
export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
export function pageNumber(value: string | string[] | undefined): number {
  const raw = firstParam(value) ?? '1';
  const page = Number(raw);
  return /^\d+$/.test(raw) && Number.isSafeInteger(page) && page > 0 && page <= 1_000_000 ? page : 1;
}

/** Index pagination, but not arbitrary searches/filters. Strip tracking parameters. */
export function catalogMetadata(path: string, params: SearchParams, filterKeys: readonly string[]) {
  const canonicalParams = new URLSearchParams();
  for (const key of filterKeys) {
    const value = firstParam(params[key])?.trim();
    if (value && !(key === 'sort' && value === 'newest')) canonicalParams.set(key, value);
  }
  const filtered = canonicalParams.size > 0;
  const page = pageNumber(params.page);
  if (page > 1) canonicalParams.set('page', String(page));
  const query = canonicalParams.toString();
  return {
    alternates: {canonical: `${path}${query ? `?${query}` : ''}`},
    robots: {index: !filtered, follow: true},
  };
}
