export type ListingStatus = "draft" | "pending_review" | "published" | "rejected" | "paused" | "blocked";
export type ListingType = "product" | "service" | "ad";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketCategory = "facturacion" | "tecnico" | "contenido" | "cuenta" | "general";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type Company = {
  id: string;
  ref_code: string;           // TP-0001 — identificador público único
  rfc: string | null;         // RFC/CIF — previene cuentas duplicadas
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
  accepted_terms_at: string | null;
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
  price_mxn: number | null;
  unit: string | null;
  min_purchase_qty: number | null;
  location: string | null;
  contact_override: { method?: string | null; value?: string | null } | null;
  external_url: string | null;
  status: ListingStatus;
  rejection_reason: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at?: string | null;
  photos?: ListingPhoto[];
  company?: Pick<Company, "name" | "slug" | "location" | "website" | "phone" | "email" | "whatsapp" | "logo_url">;
};

export type Ticket = {
  id: number;
  ticket_code: string;        // TK-0001
  company_id: string;
  category: TicketCategory;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  company?: Pick<Company, "name" | "ref_code">;
};

export type TicketMessage = {
  id: number;
  ticket_id: number;
  author_id: string;
  is_internal: boolean;
  body: string;
  created_at: string;
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
