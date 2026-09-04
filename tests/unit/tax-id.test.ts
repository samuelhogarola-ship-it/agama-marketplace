import assert from "node:assert/strict";
import test from "node:test";

import { normalizeTaxId, taxIdSaveError } from "../../src/lib/tax-id.ts";

test("RFC/CIF values are stored trimmed and uppercase", () => {
  assert.equal(normalizeTaxId("  b12345678  "), "B12345678");
  assert.equal(normalizeTaxId(" abc 010203 xy9 "), "ABC010203XY9");
  assert.equal(normalizeTaxId("   "), null);
});

test("duplicate RFC/CIF errors explain that another company already uses it", () => {
  assert.equal(
    taxIdSaveError({ code: "23505", message: "duplicate key value violates unique constraint mkt_companies_rfc_uidx" }),
    "Este RFC/CIF ya está registrado por otra empresa.",
  );
});

test("other profile errors keep a safe and actionable message", () => {
  assert.equal(
    taxIdSaveError({ code: "42501", message: "permission denied" }),
    "No se pudo guardar la ficha. Revisa los datos e inténtalo de nuevo.",
  );
});
