const UMAMI_URL = process.env.NEXT_PUBLIC_UMAMI_URL;
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const UMAMI_USER = process.env.UMAMI_API_USER;
const UMAMI_PASS = process.env.UMAMI_API_PASS;

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string | null> {
  if (!UMAMI_URL || !UMAMI_USER || !UMAMI_PASS) return null;
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;

  const res = await fetch(`${UMAMI_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: UMAMI_USER, password: UMAMI_PASS }),
  });
  if (!res.ok) return null;
  const { token } = await res.json();
  cachedToken = { value: token, expiresAt: Date.now() + 55 * 60 * 1000 };
  return token;
}

async function umamiGet<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const token = await getToken();
  if (!token || !UMAMI_URL || !UMAMI_WEBSITE_ID) return null;

  const qs = new URLSearchParams(params).toString();
  const res = await fetch(
    `${UMAMI_URL}/api/websites/${UMAMI_WEBSITE_ID}${path}?${qs}`,
    { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } },
  );
  if (!res.ok) return null;
  return res.json();
}

export type UmamiStats = {
  pageviews: { value: number; prev: number };
  visitors: { value: number; prev: number };
  visits: { value: number; prev: number };
  bounces: { value: number; prev: number };
  totaltime: { value: number; prev: number };
};

export type UmamiMetric = { x: string; y: number };
export type UmamiSeries = { x: string; y: number }[];

export async function getStats(
  startAt: number,
  endAt: number,
  url?: string,
): Promise<UmamiStats | null> {
  const params: Record<string, string> = {
    startAt: String(startAt),
    endAt: String(endAt),
  };
  if (url) params.url = url;
  return umamiGet("/stats", params);
}

export async function getMetrics(
  type: "url" | "referrer" | "browser" | "os" | "device" | "country" | "event",
  startAt: number,
  endAt: number,
  url?: string,
  limit = 10,
): Promise<UmamiMetric[] | null> {
  const params: Record<string, string> = {
    type,
    startAt: String(startAt),
    endAt: String(endAt),
    limit: String(limit),
  };
  if (url) params.url = url;
  return umamiGet("/metrics", params);
}

export async function getPageviews(
  startAt: number,
  endAt: number,
  unit: "hour" | "day" | "month" = "day",
  url?: string,
): Promise<{ pageviews: UmamiSeries; sessions: UmamiSeries } | null> {
  const params: Record<string, string> = {
    startAt: String(startAt),
    endAt: String(endAt),
    unit,
  };
  if (url) params.url = url;
  return umamiGet("/pageviews", params);
}

export function isConfigured(): boolean {
  return !!(UMAMI_URL && UMAMI_WEBSITE_ID && UMAMI_USER && UMAMI_PASS);
}
