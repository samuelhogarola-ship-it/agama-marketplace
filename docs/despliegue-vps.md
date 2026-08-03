# Despliegue TodoPlástico en el VPS

## Arquitectura

- Next.js en Docker, aislado de las aplicaciones de AGAMA.
- Puerto interno del contenedor: `3000`.
- Puerto local del VPS: `3010`.
- Nginx/Caddy publica `todo-plastico.com` hacia `127.0.0.1:3010`.
- Supabase independiente para Auth, Postgres y Storage.

## Variables de producción

Crea `.env.production` en el VPS. No lo subas al repositorio:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tiynnllrcdhsvrzsdsct.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
NEXT_PUBLIC_SITE_URL=https://todo-plastico.com
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
TODO_PLASTICO_ADMIN_EMAILS=<email-admin-1>,<email-admin-2>
ANTHROPIC_API_KEY=<anthropic-key>
ALLOW_INDEXING=true
```

La `service role key` solo se usa en servidor y nunca debe empezar por `NEXT_PUBLIC_`.

## Crear el Supabase nuevo

1. Crear un proyecto independiente para TodoPlástico.
2. Ejecutar todas las migraciones en orden: `0001` a `0008`.
3. Comprobar las tablas `mkt_*` y el bucket `mkt-photos`.
4. Configurar Auth con Site URL `https://todo-plastico.com` y redirect `https://todo-plastico.com/auth/callback`.
5. Configurar SMTP/Resend antes de invitar empresas.
6. Crear el primer usuario admin y añadir su email a `TODO_PLASTICO_ADMIN_EMAILS`.

## Primer despliegue

```bash
git clone <repositorio> agama-marketplace
cd agama-marketplace
cp .env.example .env.production
# editar .env.production con las credenciales reales
docker compose -f docker-compose.prod.yml up -d --build
curl http://127.0.0.1:3010/api/health
```

## Actualizaciones

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker image prune -f
```

Conservar un backup de Supabase antes de actualizar y comprobar `/api/health` después del reinicio.

## Nginx mínimo

```nginx
server {
    server_name todo-plastico.com www.todo-plastico.com;
    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activar HTTPS antes de habilitar `ALLOW_INDEXING`.
