-- Grant read access to plan and ref_code columns on mkt_companies.
-- Migration 0004 restricted column-level SELECT but omitted these two columns,
-- causing queries that include them to silently fail via PostgREST.
grant select (plan, ref_code)
  on public.mkt_companies to anon, authenticated;
