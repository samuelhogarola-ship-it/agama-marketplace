import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationPath = new URL("../../supabase/migrations/0015_ai_review_concurrency.sql", import.meta.url);

test("AI review claims are unique, expire, and can only be used by service_role", () => {
  const sql = readFileSync(migrationPath, "utf8");

  assert.match(sql, /listing_id\s+bigint\s+primary key/i);
  assert.match(sql, /owner_token\s+uuid\s+not null/i);
  assert.match(sql, /p_owner_token\s+uuid/i);
  assert.match(sql, /claimed_at\s*<\s*now\(\)\s*-\s*interval\s+'5 minutes'/i);
  assert.match(sql, /where listing_id = p_listing_id[\s\S]*owner_token = p_owner_token/i);
  assert.match(sql, /function public\.mkt_renew_ai_review_claim/i);
  assert.match(sql, /revoke all on function public\.mkt_claim_ai_review/i);
  assert.match(sql, /grant execute on function public\.mkt_claim_ai_review[\s\S]*to service_role/i);
});

test("saving an AI recommendation atomically validates the version and lease owner", () => {
  const sql = readFileSync(migrationPath, "utf8");

  assert.match(sql, /function public\.mkt_save_ai_review/i);
  assert.match(sql, /select updated_at[\s\S]*for update/i);
  assert.match(sql, /listing_updated_at = p_listing_updated_at[\s\S]*owner_token = p_owner_token/i);
  assert.match(sql, /insert into public\.mkt_moderation_events/i);
});

test("photo mutations invalidate cached AI reviews in the database transaction", () => {
  const sql = readFileSync(migrationPath, "utf8");

  assert.match(sql, /after insert or update or delete on public\.mkt_listing_photos/i);
  assert.match(sql, /update public\.mkt_listings[\s\S]*set updated_at = clock_timestamp\(\)/i);
});
