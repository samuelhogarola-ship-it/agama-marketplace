"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackEvent } from "@/lib/analytics";

type TrackedContactLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  contactType: string;
  listingId?: number;
  companySlug?: string | null;
};

export default function TrackedContactLink({
  contactType,
  listingId,
  companySlug,
  onClick,
  children,
  ...props
}: TrackedContactLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        trackEvent("contact_click", {
          contact_type: contactType,
          listing_id: listingId,
          company_slug: companySlug,
        });
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
