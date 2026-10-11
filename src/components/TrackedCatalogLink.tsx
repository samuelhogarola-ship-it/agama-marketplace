"use client";

import Link from 'next/link';
import type { ReactNode } from 'react';
import { trackEvent } from '@/lib/analytics';

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  eventName: 'content_catalog_click' | 'catalog_listing_click';
  category: string;
  article?: string;
  listingId?: number;
};

export default function TrackedCatalogLink({href,children,className,eventName,category,article,listingId}:Props) {
  return <Link href={href} className={className} onClick={() => {
    trackEvent(eventName, {category, article_slug:article, listing_id:listingId});
  }}>{children}</Link>;
}
