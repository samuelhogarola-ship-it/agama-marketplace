export type ListingStatus = "draft" | "pending_review" | "published" | "rejected" | "paused" | "blocked";
export type ListingType = "product" | "service" | "ad";

export type Company = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  categories: string[] | null;
  logo_url: string | null;
  plan: "free" | "pro";
  is_verified: boolean;
  is_featured: boolean;
  status: "active" | "blocked";
  created_at: string;
};

export type Listing = {
  id: number;
  company_id: string;
  title: string;
  slug: string;
  description: string;
  type: ListingType;
  category: string;
  tags: string[] | null;
  price_mxn: number | null; // null = "a consultar"
  unit: string | null;
  min_purchase_qty: number | null;
  location: string | null;
  contact_override: { method?: string | null; value?: string | null } | null;
  external_url: string | null;
  status: ListingStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at?: string | null;
  photos?: ListingPhoto[];
  company?: Pick<Company, "name" | "slug" | "location" | "website" | "phone" | "email" | "whatsapp">;
};

export type ListingPhoto = { id: number; listing_id: number; storage_path: string; position: number; alt_text: string | null };

export type Product = Listing;
export type Profile = Company;

export function photoUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/mkt-photos/${path}`;
}

export function listingPath(p: Pick<Listing, "slug" | "id">): string {
  return `/p/${p.slug}-${p.id}`;
}

export const productPath = listingPath;
