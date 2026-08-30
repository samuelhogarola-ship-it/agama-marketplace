import assert from "node:assert/strict";
import test from "node:test";

import { protectedAreaRedirect } from "../../src/lib/auth-role.ts";
import { isAdminUser } from "../../src/lib/supabase/admin.ts";

test("an explicit company role overrides the legacy admin email list", () => {
  process.env.TODO_PLASTICO_ADMIN_EMAILS =
    "samuel.hogarola@gmail.com,info@webfuengirola.com";

  assert.equal(
    isAdminUser({
      email: "samuel.hogarola@gmail.com",
      app_metadata: { role: "company" },
    }),
    false,
  );
});

test("an explicit admin role grants administrator access", () => {
  process.env.TODO_PLASTICO_ADMIN_EMAILS = "";

  assert.equal(
    isAdminUser({
      email: "info@webfuengirola.com",
      app_metadata: { role: "admin" },
    }),
    true,
  );
});

test("protected areas keep administrators and companies separated", () => {
  assert.equal(protectedAreaRedirect("/panel", "admin"), "/admin");
  assert.equal(protectedAreaRedirect("/panel/perfil", "admin"), "/admin");
  assert.equal(protectedAreaRedirect("/admin", "company"), "/panel");
  assert.equal(protectedAreaRedirect("/admin/nuevo-anuncio", "company"), "/panel");
  assert.equal(protectedAreaRedirect("/panel", undefined), null);
});
