import {test,expect} from '@playwright/test';
test('invalid callback returns a Spanish recovery message without authenticating', async ({page})=>{
  await page.goto('/auth/callback?type=unsupported&token_hash=invalid');
  await expect(page).toHaveURL(/\/ingresar\?error=enlace-invalido/);
  await expect(page.getByText('El enlace expiró o ya fue usado. Solicita uno nuevo.')).toBeVisible();
  await expect(page.getByRole('link',{name:'¿Olvidaste tu contraseña?'})).toBeVisible();
});
test('login and recovery present Spanish actions',async({page})=>{
  await page.goto('/ingresar');
  await expect(page.getByLabel('Email de empresa')).toBeVisible();
  await expect(page.getByLabel('Contraseña',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Prefiero ingresar sin contraseña (enlace mágico)',exact:true}).click();
  await expect(page.getByRole('button',{name:'Enviarme enlace de acceso'})).toBeVisible();
  await expect(page.getByLabel('Contraseña',{exact:true})).toHaveCount(0);
  await page.goto('/ingresar/recuperar');
  await expect(page.getByRole('heading',{level:1})).toContainText('contraseña');
});
test('opening an email link repeatedly only displays a confirmation form',async({request})=>{
  const url='/auth/confirm?token_hash=test-hash&type=email&next=%2Fpanel';
  for (let attempt=0; attempt<2; attempt++) {
    const response=await request.get(url);
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toContain('no-store');
    expect(response.headers()['referrer-policy']).toBe('strict-origin');
    expect(response.headers()['x-robots-tag']).toContain('noindex');
    const html=await response.text();
    expect(html).toContain('method="post"');
    expect(html).toContain('Continuar en TodoPlásticos');
    expect(html).not.toMatch(/<script|<img|<iframe/);
  }
});
test('confirmation rejects cross-origin submissions',async({request})=>{
  const response=await request.post('/auth/confirm',{headers:{origin:'https://evil.example'},form:{token_hash:'test-hash',type:'email'},maxRedirects:0});
  expect(response.status()).toBe(403);
});
test('invalid confirmation submission returns to the Spanish login error',async({request,baseURL})=>{
  const response=await request.post('/auth/confirm',{headers:{origin:new URL(baseURL!).origin},form:{token_hash:'test-hash',type:'unsupported'},maxRedirects:0});
  expect(response.status()).toBe(303);
  expect(response.headers().location).toBe(`${baseURL}/ingresar?error=enlace-invalido`);
});
test('the same-origin confirmation button submits successfully without exposing the token in the referrer',async({page})=>{
  await page.goto('/auth/confirm?token_hash=invalid-test-hash&type=email&next=%2Fpanel',{waitUntil:'domcontentloaded'});
  const submitted = page.waitForRequest(request => request.method() === 'POST' && new URL(request.url()).pathname === '/auth/confirm');
  await page.getByRole('button',{name:'Continuar en TodoPlásticos'}).click();
  const request = await submitted;
  const origin = new URL(request.url()).origin;
  expect(request.headers().origin).toBe(origin);
  expect(request.headers().referer).toBe(`${origin}/`);
  await expect(page).toHaveURL(/\/ingresar\?error=enlace-invalido/);
  await expect(page.getByText('El enlace expiró o ya fue usado. Solicita uno nuevo.')).toBeVisible();
});
