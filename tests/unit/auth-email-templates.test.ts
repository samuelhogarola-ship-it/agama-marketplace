import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {authenticateAuthCallback} from '../../src/lib/auth-callback.ts';
const directory = new URL('../../supabase/email-templates/', import.meta.url);
for (const [file, type, destination] of [
  ['confirmation','email','/panel'], ['magic-link','email','/panel'],
  ['recovery','recovery','/panel/ajustes'], ['invite','invite','/panel/ajustes'],
  ['email-change','email_change','/panel/ajustes'],
]) {
  test(`${file}: Spanish email link uses the site domain and authenticates the intended action`, async()=>{
    const html = await readFile(new URL(`${file}.html`, directory), 'utf8');
    assert.match(html, /lang="es-MX"/);
    const href = html.match(/href="([^"]+)"/)?.[1];
    assert.ok(href);
    const url = new URL(href.replaceAll('{{ .SiteURL }}','https://todo-plastico.com').replaceAll('{{ .TokenHash }}','test-hash').replaceAll('&amp;','&'));
    assert.equal(url.origin,'https://todo-plastico.com');
    assert.equal(url.pathname,'/auth/confirm');
    assert.equal(url.searchParams.get('next'),destination);
    let verified = false;
    const result = await authenticateAuthCallback(url.searchParams, {
      exchangeCodeForSession:async()=>{throw new Error('PKCE should not be required');},
      verifyOtp:async(input)=>{assert.deepEqual(input,{type,token_hash:'test-hash'}); verified = true; return {error:null};},
    });
    assert.equal(result.ok,true);
    assert.equal(verified,true);
  });
}
test('reauthentication keeps the one-time code and every template has a branded Spanish subject', async()=>{
  const html = await readFile(new URL('reauthentication.html',directory),'utf8');
  assert.match(html,/{{ \.Token }}/);
  const subjects = JSON.parse(await readFile(new URL('subjects.json',directory),'utf8'));
  assert.equal(Object.keys(subjects).length,6);
  for (const subject of Object.values(subjects)) assert.match(String(subject),/TodoPlásticos/);
});
