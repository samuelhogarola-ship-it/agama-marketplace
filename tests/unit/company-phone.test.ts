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
