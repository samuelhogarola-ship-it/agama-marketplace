import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { loadCompany, saveCompany } from "../../src/lib/company-profile.ts";

const user = { id: "11111111-1111-4111-8111-111111111111", email: "test@example.com", user_metadata: { company_name: "Envases Prueba", accepted_terms_at: "2026-09-23T00:00:00Z" } };
const fields = { name: "Envases Actualizados", rfc: "B12345678", description: "Envases industriales", location: "México", website: "", phone: "", email: "", whatsapp: "", categories: null };

// HTTP boundary: real Supabase client, controlled PostgREST responses.
function database(initial: Record<string, unknown> | null, failure?: "read" | "write" | "zero") {
  let row = initial;
  const client = createClient("https://test.supabase.co", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input, init) => {
      const url = new URL(String(input));
      const method = init?.method ?? "GET";
      const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
      if (url.pathname.endsWith("/rpc/mkt_my_company")) {
        return failure === "read" ? reply({ code: "42501", message: "permission denied" }, 403) : reply(row);
      }
      if (!url.pathname.endsWith("/mkt_companies")) throw new Error(`Unexpected request: ${url}`);
      // Production grants allow id, but forbid SELECT * (RFC/billing are private).
      if (url.searchParams.has("select") && url.searchParams.get("select") !== "id") return reply({ code: "42501", message: "permission denied for table mkt_companies" }, 403);
      if (failure === "write") return reply({ code: "23505", message: "duplicate key mkt_companies_rfc_uidx" }, 409);
      const body = JSON.parse(String(init?.body));
      if (body.categories === null) return reply({ code: "23502", message: "null value in column categories violates not-null constraint" }, 400);
      if (method === "POST") {
        if (row) return reply({ code: "23505", message: "duplicate primary key" }, 409);
        row = { ...body, plan: "free", status: "active" };
      } else if (method === "PATCH") {
        assert.equal(url.searchParams.get("id"), `eq.${user.id}`);
        if (failure === "zero") return reply([]);
        if (row) row = { ...row, ...body };
      } else throw new Error(`Unexpected method: ${method}`);
      return reply(row ? [{ id: row.id }] : []);
    } },
  });
  return { client, row: () => row };
}

test("an existing company loads through the private owner RPC without SELECT *", async () => {
  const db = database({ id: user.id, name: "Empresa existente", slug: "existing", rfc: "PRIVATE" });
  const result = await loadCompany(db.client, user);
  assert.equal(result.name, "Empresa existente");
  assert.equal(result.rfc, "PRIVATE");
});

test("first panel visit creates a company and returns it despite restricted column grants", async () => {
  const db = database(null);
  const result = await loadCompany(db.client, user);
  assert.equal(result.id, user.id);
  assert.equal(result.name, "Envases Prueba");
  assert.equal(result.accepted_terms_at, "2026-09-23T00:00:00Z");
});

test("saving a first company persists the complete form, even without visiting the summary", async () => {
  const db = database(null);
  await saveCompany(db.client, user, fields);
  assert.equal(db.row()?.name, "Envases Actualizados");
  assert.equal(db.row()?.rfc, "B12345678");
  assert.deepEqual(db.row()?.categories, []);
  assert.equal(db.row()?.id, user.id);
  assert.ok(db.row()?.slug);
  const reopened = await loadCompany(db.client, user);
  assert.equal(reopened.name, "Envases Actualizados");
  assert.deepEqual(reopened.categories, []);
});

test("editing preserves the company slug and confirms an affected row", async () => {
  const db = database({ id: user.id, name: "Anterior", slug: "original" });
  await saveCompany(db.client, user, fields);
  assert.equal(db.row()?.name, "Envases Actualizados");
  assert.equal(db.row()?.slug, "original");
});

test("read failures do not create replacement companies", async () => {
  const db = database(null, "read");
  await assert.rejects(loadCompany(db.client, user));
  assert.equal(db.row(), null);
});

test("duplicate tax IDs are surfaced and cannot report a successful save", async () => {
  const db = database(null, "write");
  await assert.rejects(saveCompany(db.client, user, fields), (error: unknown) => (error as { code: string }).code === "23505");
  assert.equal(db.row(), null);
});

test("a zero-row update on an existing company cannot report success", async () => {
  const db = database({ id: user.id, name: "Anterior", slug: "original" }, "zero");
  await assert.rejects(saveCompany(db.client, user, fields));
  assert.equal(db.row()?.name, "Anterior");
});

test("the first save persists the uploaded company logo", async () => {
  const db = database(null);
  await saveCompany(db.client, user, { ...fields, logo_url: "https://test.supabase.co/storage/v1/object/public/mkt-photos/logos/test.png" });
  assert.equal(db.row()?.logo_url, "https://test.supabase.co/storage/v1/object/public/mkt-photos/logos/test.png");
});

import { contactValues } from "../../src/lib/company-phone.ts";

test("saving selected contact channels clears disabled public contacts and survives reload", async () => {
  const db = database({ id: user.id, name: "Empresa", slug: "original", phone: "+525512345678", whatsapp: "+34612345678", email: "anterior@example.com" });
  const draft = { phone: { country: "MX" as const, national: "5512345678" }, whatsapp: { country: "ES" as const, national: "612345678" }, email: "ventas@example.com" };
  await saveCompany(db.client, user, { ...fields, ...contactValues({ phone: false, email: true, whatsapp: false }, draft) });
  const emailOnly = await loadCompany(db.client, user);
  assert.equal(emailOnly.phone, null);
  assert.equal(emailOnly.whatsapp, null);
  assert.equal(emailOnly.email, "ventas@example.com");
  await saveCompany(db.client, user, { ...fields, ...contactValues({ phone: true, email: false, whatsapp: true }, draft) });
  const twoChannels = await loadCompany(db.client, user);
  assert.equal(twoChannels.phone, "+525512345678");
  assert.equal(twoChannels.whatsapp, "+34612345678");
  assert.equal(twoChannels.email, null);
});
