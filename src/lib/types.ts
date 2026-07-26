export type ProductStatus = "draft" | "pending_review" | "published" | "rejected" | "paused" | "blocked";

export type Profile = {
  id: string;
  company_name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  zone: string | null;
  logo_path: string | null;
  plan: "free" | "pro";
  created_at: string;
};

export type Product = {
  id: number;
  owner_id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  price_mxn: number | null; // null = "a consultar"
  unit: string | null;
  zone: string | null;
  status: ProductStatus;
  reject_reason: string | null;
  created_at: string;
  photos?: ProductPhoto[];
  profile?: Pick<Profile, "company_name" | "slug" | "zone">;
};

export type ProductPhoto = { id: number; product_id: number; path: string; position: number };

export type Conversation = {
  id: number;
  product_id: number | null;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  last_message_at: string;
};

export type Message = {
  id: number;
  conversation_id: number;
  sender_id: string;
  body: string;
  status: "delivered" | "rejected";
  created_at: string;
};

export function photoUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/mkt-photos/${path}`;
}

export function productPath(p: Pick<Product, "slug" | "id">): string {
  return `/p/${p.slug}-${p.id}`;
}
