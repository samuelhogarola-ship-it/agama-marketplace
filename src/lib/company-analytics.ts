import type { UmamiStats, UmamiMetric, UmamiSeries } from './umami';
type Listing = {id: number; slug: string | null; title: string; status: string};
type AnalyticsClient = {
  getStats(start: number, end: number, url: string): Promise<UmamiStats | null>;
  getPageviews(start: number, end: number, unit: 'hour' | 'day', url: string): Promise<{pageviews: UmamiSeries; sessions: UmamiSeries} | null>;
  getMetrics(type: 'referrer' | 'device', start: number, end: number, url: string, limit: number): Promise<UmamiMetric[] | null>;
  getContactClicks(start: number, end: number, url: string): Promise<number | null>;
};
export function analyticsDays(raw: string | null): number | null {
  if (raw === null || raw === '') return 30;
  const days = Number(raw);
  return /^\d+$/.test(raw) && Number.isInteger(days) && days >= 1 && days <= 90 ? days : null;
}
function required<T>(value: T | null): T {
  if (value === null) throw new Error('analytics_unavailable');
  return value;
}

export async function companyAnalytics(client: AnalyticsClient, slug: string, listings: Listing[], days: number, endAt: number) {
  const startAt = endAt - days * 86_400_000;
  const prevStartAt = startAt - days * 86_400_000;
  const companyUrl = `/e/${slug}`;
  const [current, previous, series, contacts, referrers, devices] = await Promise.all([
    client.getStats(startAt, endAt, companyUrl),
    client.getStats(prevStartAt, startAt - 1, companyUrl),
    client.getPageviews(startAt, endAt, days <= 2 ? 'hour' : 'day', companyUrl),
    client.getContactClicks(startAt, endAt, companyUrl),
    client.getMetrics('referrer', startAt, endAt, companyUrl, 5),
    client.getMetrics('device', startAt, endAt, companyUrl, 5),
  ]);
  const profile = required(current);
  let contactClicks = required(contacts);
  let previousViews = 0;
  const perListing: {id:number; title:string; status:string; url:string; pageviews:number; visitors:number}[] = [];
  const unique = [...new Map(listings.map(listing => [listing.id, listing])).values()];
  // Bound concurrency without silently discarding listings after the first 20.
  for (let index = 0; index < unique.length; index += 5) {
    const batch = await Promise.all(unique.slice(index, index + 5).map(async listing => {
      const url = `/p/${listing.slug || 'anuncio'}-${listing.id}`;
      const [stats, prev, clicks] = await Promise.all([
        client.getStats(startAt, endAt, url),
        client.getStats(prevStartAt, startAt - 1, url),
        client.getContactClicks(startAt, endAt, url),
      ]);
      return {listing, url, stats:required(stats), prev:required(prev), clicks:required(clicks)};
    }));
    for (const item of batch) {
      previousViews += item.prev.pageviews.value;
      contactClicks += item.clicks;
      perListing.push({id:item.listing.id, title:item.listing.title, status:item.listing.status, url:item.url, pageviews:item.stats.pageviews.value, visitors:item.stats.visitors.value});
    }
  }
  return {
    period: {days, startAt, endAt},
    profile: {pageviews:profile.pageviews.value, visitors:profile.visitors.value, series:required(series)},
    listings: {
      totalPageviews: perListing.reduce((sum, row) => sum + row.pageviews, 0),
      // Sum of per-page visitors, NOT distinct people across all pages.
      totalVisitors: perListing.reduce((sum, row) => sum + row.visitors, 0),
      perListing: perListing.sort((a,b) => b.pageviews - a.pageviews),
    },
    contactClicks, referrers:required(referrers), devices:required(devices),
    prevPeriod: {profilePageviews:required(previous).pageviews.value, listingPageviews:previousViews},
  };
}

export async function readCompanyListings(read: (from: number, to: number) => PromiseLike<{data: Listing[] | null; error: unknown}>) {
  const listings: Listing[] = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const {data, error} = await read(from, from + pageSize - 1);
    if (error || !data) throw new Error('analytics_unavailable');
    listings.push(...data);
    if (data.length < pageSize) return listings;
  }
}
