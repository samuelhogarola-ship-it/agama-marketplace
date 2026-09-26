import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmationHeaders, confirmationScript, renderEmailConfirmation } from '../../src/lib/auth-confirmation.js';
import { getEmailConfirmation } from '../../src/lib/auth-callback.ts';
import { sanitizeAuthNext } from '../../src/lib/auth-redirect.ts';
test('email confirmation validates supported OTP actions without consuming them', () => {
  assert.deepEqual(getEmailConfirmation(new URLSearchParams('token_hash=test-hash&type=recovery')), {token_hash:'test-hash',type:'recovery'});
  assert.equal(getEmailConfirmation(new URLSearchParams('token_hash=test-hash&type=unknown')),null);
  assert.equal(getEmailConfirmation(new URLSearchParams('type=email')),null);
});
test('confirmation prepares a hidden POST form without external assets', () => {
  const html = renderEmailConfirmation();
  assert.match(html,/method="post"/);
  assert.match(html,/action="\/auth\/confirm" hidden/);
  assert.doesNotMatch(html,/<script src|<img|<iframe/);
  assert.match(html,/Activa JavaScript/);
});
test('confirmation script clears the fragment and CSP restricts execution to its hash',()=>{
  assert.match(confirmationScript,/window.location.hash/);
  assert.match(confirmationScript,/history.replaceState/);
  assert.doesNotMatch(confirmationScript,/fetch\(|\.submit\(|innerHTML/);
  assert.match(confirmationHeaders['Content-Security-Policy'],/script-src 'sha256-[A-Za-z0-9+/=]+';/);
});
test('auth destinations reject browser-normalized external paths and controls',()=>{
  for (const path of ['//evil.example','/\\evil.example','/\n/evil.example','https://evil.example']) assert.equal(sanitizeAuthNext(path,'/panel'),'/panel');
  assert.equal(sanitizeAuthNext('/panel/ajustes?tab=clave','/panel'),'/panel/ajustes?tab=clave');
});
