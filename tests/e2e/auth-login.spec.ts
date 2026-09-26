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
