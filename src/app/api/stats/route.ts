import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as umami from "@/lib/umami";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: company } = await supabase
    .from("mkt_companies")
    .select("id, slug, plan")
    .eq("id", user.id)
    .single();

  if (!company || company.plan !== "pro") {
    return NextResponse.json({ error: "pro_required" }, { status: 403 });
  }

  if (!umami.isConfigured()) {
    return NextResponse.json({ error: "analytics_not_configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const days = Math.min(Number(searchParams.get("days") || "30"), 90);

  const endAt = Date.now();
  const startAt = endAt - days * 24 * 60 * 60 * 1000;
  const prevStartAt = startAt - (endAt - startAt);

  const { data: listings } = await supabase
    .from("mkt_listings")
    .select("id, slug, title, status")
    .eq("company_id", user.id);

  const companyUrl = `/e/${company.slug}`;
  const listingUrls = (listings ?? []).map((l) => ({
    id: l.id,
    title: l.title,
    status: l.status,
    url: `/p/${l.slug || "anuncio"}-${l.id}`,
  }));

  const [profileStats, profileSeries, contactEvents, topReferrers, deviceMetrics] =
    await Promise.all([
      umami.getStats(startAt, endAt, companyUrl),
      umami.getPageviews(startAt, endAt, days <= 7 ? "hour" : "day", companyUrl),
      umami.getMetrics("event", startAt, endAt, undefined, 50),
      umami.getMetrics("referrer", startAt, endAt, companyUrl, 5),
      umami.getMetrics("device", startAt, endAt, companyUrl, 5),
    ]);

  const listingStatsResults = await Promise.all(
    listingUrls.slice(0, 20).map(async (l) => {
      const stats = await umami.getStats(startAt, endAt, l.url);
      return { ...l, pageviews: stats?.pageviews.value ?? 0, visitors: stats?.visitors.value ?? 0 };
    }),
  );

  const contactClicks = (contactEvents ?? [])
    .filter((e) => e.x === "contact_click")
    .reduce((sum, e) => sum + e.y, 0);

  const totalListingViews = listingStatsResults.reduce((sum, l) => sum + l.pageviews, 0);
  const totalListingVisitors = listingStatsResults.reduce((sum, l) => sum + l.visitors, 0);

  return NextResponse.json({
    period: { days, startAt, endAt },
    profile: {
      pageviews: profileStats?.pageviews.value ?? 0,
      visitors: profileStats?.visitors.value ?? 0,
      series: profileSeries,
    },
    listings: {
      totalPageviews: totalListingViews,
      totalVisitors: totalListingVisitors,
      perListing: listingStatsResults.sort((a, b) => b.pageviews - a.pageviews),
    },
    contactClicks,
    referrers: topReferrers ?? [],
    devices: deviceMetrics ?? [],
    prevPeriod: {
      profilePageviews: (await umami.getStats(prevStartAt, startAt, companyUrl))?.pageviews.value ?? 0,
      listingPageviews: 0,
    },
  });
}
