import assert from "node:assert/strict";
import test from "node:test";
import { countriesForSearch, readPhone, phoneError, phoneValue, phoneDigits } from "../../src/lib/company-phone.ts";

test("country search works in Spanish, without accents, by code or calling code", () => {
  for (const query of ["España", "espana", "ES", "SP", "+34"]) assert.equal(countriesForSearch(query)[0]?.code, "ES");
  assert.equal(countriesForSearch("mexico")[0]?.code, "MX");
  assert.equal(countriesForSearch("")[0]?.code, "MX");
});

test("Mexican phone requires explicit prefix and ten national digits", () => {
  assert.ok(phoneError({ country: "", national: "5512345678" }));
  assert.ok(phoneError({ country: "MX", national: "551234567" }));
  assert.ok(phoneError({ country: "MX", national: "55123456789" }));
  assert.ok(phoneError({ country: "MX", national: "551234abcd" }));
  assert.equal(phoneError({ country: "MX", national: "5512345678" }), null);
  assert.equal(phoneValue({ country: "MX", national: "5512345678" }), "+525512345678");
});

test("foreign phones retain their country code; input keeps only digits", () => {
  assert.equal(phoneValue({ country: "ES", national: "612345678" }), "+34612345678");
  assert.equal(phoneValue({ country: "US", national: "2025550123" }), "+12025550123");
  assert.equal(phoneDigits("55 (12) ab 34-5678"), "5512345678");
  assert.equal(phoneError({ country: "", national: "" }), null);
});

test("existing international phones reload without losing prefix or digits", () => {
  assert.deepEqual(readPhone("+52 55 1234 5678"), { country: "MX", national: "5512345678" });
  assert.deepEqual(readPhone("0034 612 345 678"), { country: "ES", national: "612345678" });
  assert.deepEqual(readPhone("+34 612 345 678"), { country: "ES", national: "612345678" });
  assert.deepEqual(readPhone("5512345678"), { country: "", national: "5512345678" });
  assert.deepEqual(readPhone("+9991234567"), { country: "", national: "+9991234567" });
});

import * as contact from "../../src/lib/company-phone.ts";
const draft = { phone: { country: "MX" as const, national: "5512345678" }, whatsapp: { country: "ES" as const, national: "612345678" }, email: "ventas@example.com" };

test("at least one contact channel must be selected; any single channel is enough", () => {
  assert.equal(typeof contact.contactError, "function");
  assert.ok(contact.contactError({ phone: false, email: false, whatsapp: false }, draft));
  for (const key of ["phone", "email", "whatsapp"] as const) {
    assert.equal(contact.contactError({ phone: false, email: false, whatsapp: false, [key]: true }, draft), null);
  }
  assert.equal(contact.contactError({ phone: true, email: true, whatsapp: true }, draft), null);
});

test("every enabled contact must be complete, even when another is valid", () => {
  assert.equal(typeof contact.contactError, "function");
  assert.ok(contact.contactError({ phone: true, email: true, whatsapp: false }, { ...draft, phone: { country: "", national: "" } }));
  assert.ok(contact.contactError({ phone: true, email: true, whatsapp: false }, { ...draft, email: "incompleto" }));
  assert.ok(contact.contactError({ phone: false, email: false, whatsapp: true }, { ...draft, whatsapp: { country: "", national: "612345678" } }));
});

test("disabled contacts do not block saving or remain publicly exposed", () => {
  assert.equal(typeof contact.contactValues, "function");
  const enabled = { phone: false, email: true, whatsapp: false };
  const invalidHidden = { ...draft, phone: { country: "" as const, national: "abc" }, whatsapp: { country: "" as const, national: "" } };
  assert.equal(contact.contactError(enabled, invalidHidden), null);
  assert.deepEqual(contact.contactValues(enabled, invalidHidden), { phone: null, email: "ventas@example.com", whatsapp: null });
  assert.deepEqual(contact.contactValues({ phone: true, email: false, whatsapp: true }, draft), { phone: "+525512345678", email: null, whatsapp: "+34612345678" });
});
