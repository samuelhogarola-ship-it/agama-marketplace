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

import * as taxId from "../../src/lib/tax-id.ts";

test("company RFC rejects personal IDs, wrong characters, lengths and impossible dates", () => {
  assert.equal(typeof taxId.companyRfcError, "function", "company RFC validation must exist");
  for (const value of ["ABCD010203XY9", "B12345678", "ABC010203XY99", "ABC010203XY", "ABC011332XY9", "ABC230229XY9", "ABC010203X!9", "123456789012"]) {
    assert.ok(taxId.companyRfcError(value), value);
  }
  for (const value of ["ABC010203XY9", "A&Ñ240229A01", " abc010203xy9 ", ""]) {
    assert.equal(taxId.companyRfcError(value), null, value);
  }
});

test("typing a company RFC strips unrelated symbols and limits it to 12 characters", () => {
  assert.equal(typeof taxId.companyRfcInput, "function");
  assert.equal(taxId.companyRfcInput("abc-010203 xy9!!!EXTRA"), "ABC010203XY9");
  assert.equal(taxId.companyRfcInput("ñ&á🙂 123"), "Ñ&123");
});
