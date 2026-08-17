"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

type SearchAnalyticsProps = {
  query: string;
  category?: string;
  location?: string;
  resultsCount: number;
};

export default function SearchAnalytics({
  query,
  category,
  location,
  resultsCount,
}: SearchAnalyticsProps) {
  useEffect(() => {
    if (!query) return;
    trackEvent("search", {
      search_term: query,
      category,
      location,
      results_count: resultsCount,
    });
  }, [category, location, query, resultsCount]);

  return null;
}
