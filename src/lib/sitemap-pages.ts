/** Read every database page; never turn an upstream outage into a partial sitemap. */
export async function readSitemapRows<T>(read: (from: number, to: number) => PromiseLike<{data: T[] | null; error: unknown}>) {
  const rows: T[] = [];
  const size = 500;
  for (let from = 0; ; from += size) {
    const {data, error} = await read(from, from + size - 1);
    if (error || !data) throw new Error('Sitemap data unavailable');
    rows.push(...data);
    if (data.length < size) return rows;
  }
}
