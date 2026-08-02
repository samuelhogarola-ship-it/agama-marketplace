# Resend + magic link

TodoPlástico queda preparado para acceso sin contraseña. La app usa Supabase Auth con PKCE y sesión persistente en el navegador.

## Supabase Auth

En el proyecto Supabase `tiynnllrcdhsvrzsdsct`, configurar:

- Authentication > URL Configuration:
  - Site URL local: `http://localhost:3002`
  - Redirect URL local: `http://localhost:3002/auth/callback`
  - Redirect URL producción: `https://todo-plastico.com/auth/callback`
- Authentication > Providers > Email:
  - Enable Email provider
  - Confirm email: activado
  - Secure email change: activado
- Authentication > SMTP Settings:
  - Sender: `TodoPlástico <acceso@todo-plastico.com>`
  - Host: `smtp.resend.com`
  - Port: `465`
  - Username: `resend`
  - Password: API key de Resend

## Variables locales

La app no necesita la clave de Resend si Supabase manda los correos. Mantener en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tiynnllrcdhsvrzsdsct.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
TODO_PLASTICO_ADMIN_EMAILS=admin@example.com
TODO_PLASTICO_SEED_ADMIN_EMAIL=admin@example.com
```

Para sembrar categorías y la empresa AGAMA:

```bash
node scripts/seed-launch-data.mjs
```

El usuario admin entra desde `/ingresar` con magic link. No se usa contraseña en la interfaz.
