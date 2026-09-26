import test from 'node:test';
import assert from 'node:assert/strict';
import { renderEmailConfirmation } from '../../src/lib/auth-confirmation.ts';
import { getEmailConfirmation } from '../../src/lib/auth-callback.ts';
import { sanitizeAuthNext } from '../../src/lib/auth-redirect.ts';
test('email confirmation validates supported OTP actions without consuming them', () => {
  assert.deepEqual(getEmailConfirmation(new URLSearchParams('token_hash=test-hash&type=recovery')), {token_hash:'test-hash',type:'recovery'});
  assert.equal(getEmailConfirmation(new URLSearchParams('token_hash=test-hash&type=unknown')),null);
  assert.equal(getEmailConfirmation(new URLSearchParams('type=email')),null);
});
test('confirmation requires a POST button and escapes hidden values without scripts or tracking', () => {
  const html = renderEmailConfirmation({token_hash:'test-hash',type:'email',next:'/panel?x="<script>'});
  assert.match(html,/method="post"/);
  assert.match(html,/action="\/auth\/confirm"/);
  assert.match(html,/<button type="submit">/);
  assert.doesNotMatch(html,/<script|<img|<iframe/);
  assert.match(html,/&quot;&lt;script&gt;/);
});
test('invalid confirmation shows a recovery link without a token form',()=>{
  const html = renderEmailConfirmation(null);
  assert.doesNotMatch(html,/<form/);
  assert.match(html,/Solicita un nuevo enlace/);
});
test('auth destinations reject browser-normalized external paths and controls',()=>{
  for (const path of ['//evil.example','/\\evil.example','/\n/evil.example','https://evil.example']) assert.equal(sanitizeAuthNext(path,'/panel'),'/panel');
  assert.equal(sanitizeAuthNext('/panel/ajustes?tab=clave','/panel'),'/panel/ajustes?tab=clave');
});
