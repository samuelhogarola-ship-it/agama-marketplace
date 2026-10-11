import assert from "node:assert/strict";
import test from "node:test";

import { panelHref, panelSectionForPath } from "../../src/lib/panel-navigation.ts";

test("panel navigation marks each company screen in its corresponding section", () => {
  assert.equal(panelSectionForPath("/panel"), "summary");
  assert.equal(panelSectionForPath("/panel/perfil"), "company");
  assert.equal(panelSectionForPath("/panel/publicar"), "publish");
  assert.equal(panelSectionForPath("/panel/editar/42"), "catalog");
  assert.equal(panelSectionForPath("/panel/estadisticas"), "stats");
  assert.equal(panelSectionForPath("/panel/ajustes"), "settings");
});

test("panel preview links preserve query parameters before URL fragments", () => {
  assert.equal(panelHref("/panel", true), "/panel?preview=1");
  assert.equal(panelHref("/panel?tab=company", true), "/panel?tab=company&preview=1");
  assert.equal(panelHref("/panel#catalogo", true), "/panel?preview=1#catalogo");
  assert.equal(panelHref("/panel#catalogo", false), "/panel#catalogo");
});
