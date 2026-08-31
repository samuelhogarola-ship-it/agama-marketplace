import assert from "node:assert/strict";
import test from "node:test";

import { panelSectionForPath } from "../../src/lib/panel-navigation.ts";

test("panel navigation marks each company screen in its corresponding section", () => {
  assert.equal(panelSectionForPath("/panel"), "summary");
  assert.equal(panelSectionForPath("/panel/perfil"), "company");
  assert.equal(panelSectionForPath("/panel/publicar"), "publish");
  assert.equal(panelSectionForPath("/panel/editar/42"), "catalog");
  assert.equal(panelSectionForPath("/panel/estadisticas"), "stats");
  assert.equal(panelSectionForPath("/panel/ajustes"), "settings");
});
