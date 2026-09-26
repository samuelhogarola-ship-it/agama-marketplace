import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as umami from "@/lib/umami";
import { analyticsDays, companyAnalytics, readCompanyListings } from "@/lib/company-analytics";

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
  const days = analyticsDays(searchParams.get("days"));
  if (days === null) return NextResponse.json({ error: "invalid_period" }, { status: 400 });

  try {
    const listings = await readCompanyListings((from, to) => supabase
      .from("mkt_listings")
      .select("id, slug, title, status")
      .eq("company_id", company.id)
      .order("id")
      .range(from, to));
    return NextResponse.json(await companyAnalytics(umami, company.slug, listings ?? [], days, Date.now()));
  } catch {
    return NextResponse.json({ error: "analytics_unavailable" }, { status: 502 });
  }
}
