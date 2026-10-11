import type { SupabaseClient } from "@supabase/supabase-js";
import type { Company } from "./types";

type CompanyUser = { id: string; email?: string; user_metadata: Record<string, unknown> };
export type CompanyFields = Pick<Company, "name" | "rfc" | "description" | "location" | "website" | "phone" | "email" | "whatsapp" | "categories"> & Partial<Pick<Company, "logo_url" | "address">>;

function initialCompany(user: CompanyUser, name: string) {
  const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "empresa";
  return {
    id: user.id,
    name,
    slug: `${slug}-${user.id}`,
    ...(typeof user.user_metadata.rfc === "string" ? { rfc: user.user_metadata.rfc } : {}),
    ...(typeof user.user_metadata.accepted_terms_at === "string"
      ? { accepted_terms_at: user.user_metadata.accepted_terms_at } : {}),
  };
}

// Private fields must be read via the owner-scoped RPC, never SELECT *:
// table-level reads deliberately exclude tax IDs and billing information.
export async function loadCompany(client: SupabaseClient, user: CompanyUser): Promise<Company> {
  const { data, error } = await client.rpc("mkt_my_company");
  if (error) throw error;
  if (data) return data as Company;
  const candidate = typeof user.user_metadata.company_name === "string"
    ? user.user_metadata.company_name.trim() : user.email?.split("@")[0] ?? "";
  const name = candidate.length >= 3 ? candidate.slice(0, 120) : "Mi empresa";
  const created = await client.from("mkt_companies").insert(initialCompany(user, name)).select("id").single();
  // Two tabs may initialize the same account simultaneously. Read the owner's
  // company before treating a uniqueness conflict as a failed registration.
  if (created.error && created.error.code !== "23505") throw created.error;
  const result = await client.rpc("mkt_my_company");
  if (result.error) throw result.error;
  if (!result.data) throw created.error ?? new Error("No se pudo crear la ficha de empresa.");
  return result.data as Company;
}

export async function saveCompany(client: SupabaseClient, user: CompanyUser, fields: CompanyFields) {
  const values = { ...fields, categories: fields.categories ?? [] };
  const result = await client.from("mkt_companies").update(values).eq("id", user.id).select("id").maybeSingle();
  if (result.error) throw result.error;
  if (result.data) return;
  // Direct access to /panel/perfil must work for accounts without a company.
  const created = await client.from("mkt_companies")
    .insert({ ...initialCompany(user, fields.name), ...values }).select("id").single();
  if (created.error) throw created.error;
  if (!created.data) throw new Error("No se pudo guardar la ficha de empresa.");
}

// Opening an editable form must not reserve a registration RFC before the owner
// can correct it (for example if another company already uses that RFC).
export function loadCompanyForEditing(client: SupabaseClient, user: CompanyUser) {
  return loadCompany(client, { ...user, user_metadata: { ...user.user_metadata, rfc: undefined } });
}
