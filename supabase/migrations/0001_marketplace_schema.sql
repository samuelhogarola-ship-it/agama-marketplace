-- AGAMA Marketplace — esquema completo v1
-- Convive con otras tablas del proyecto Supabase: TODO lleva prefijo mkt_.
-- Export futuro: pg_dump -t 'public.mkt_*' (+ bucket mkt-photos).

-- ============ TABLAS ============

create table if not exists public.mkt_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null check (char_length(company_name) between 3 and 120),
  slug text not null unique,
  description text,
  phone text,
  zone text,
  logo_path text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  is_blocked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.mkt_products (
  id bigint generated always as identity primary key,
  owner_id uuid not null references public.mkt_profiles(id) on delete cascade,
  title text not null check (char_length(title) between 10 and 120),
  slug text not null,
  description text not null check (char_length(description) between 30 and 3000),
  category text not null,
  price_mxn numeric(12,2) check (price_mxn is null or price_mxn >= 0),
  unit text,
  zone text,
  status text not null default 'draft'
    check (status in ('draft','pending_review','published','rejected','paused','blocked')),
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mkt_product_photos (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.mkt_products(id) on delete cascade,
  path text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.mkt_conversations (
  id bigint generated always as identity primary key,
  product_id bigint references public.mkt_products(id) on delete set null,
  buyer_id uuid not null references public.mkt_profiles(id) on delete cascade,
  seller_id uuid not null references public.mkt_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  check (buyer_id <> seller_id),
  unique (product_id, buyer_id)
);

create table if not exists public.mkt_messages (
  id bigint generated always as identity primary key,
  conversation_id bigint not null references public.mkt_conversations(id) on delete cascade,
  sender_id uuid not null references public.mkt_profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'delivered' check (status in ('delivered','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.mkt_moderation_events (
  id bigint generated always as identity primary key,
  product_id bigint references public.mkt_products(id) on delete cascade,
  message_id bigint references public.mkt_messages(id) on delete cascade,
  verdict text not null check (verdict in ('approve','reject','review')),
  violations text[] not null default '{}',
  reason text,
  source text not null default 'rules' check (source in ('rules','ai','human')),
  created_at timestamptz not null default now()
);

create table if not exists public.mkt_search_queries (
  id bigint generated always as identity primary key,
  query text not null check (char_length(query) <= 100),
  results_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists mkt_products_status_category_idx on public.mkt_products (status, category);
create index if not exists mkt_products_owner_idx on public.mkt_products (owner_id);
create index if not exists mkt_photos_product_idx on public.mkt_product_photos (product_id);
create index if not exists mkt_messages_conversation_idx on public.mkt_messages (conversation_id);
create index if not exists mkt_conversations_buyer_idx on public.mkt_conversations (buyer_id);
create index if not exists mkt_conversations_seller_idx on public.mkt_conversations (seller_id);

-- ============ MODERACIÓN (reglas duras en BD) ============
-- Capa 1 del watcher (docs/moderacion-ia.md). La capa IA se añade como Edge Function en F2.

create or replace function public.mkt_moderate_text(p_text text)
returns table (verdict text, violations text[], reason text)
language plpgsql immutable as $$
declare
  t text := lower(coalesce(p_text, ''));
  v text[] := '{}';
begin
  -- Competencia directa de AGAMA: prohibido
  if t ~ '\m(pigmentos?|masterbatch|master\s*batch|aditivos?|colorantes?|concentrados?\s+de\s+color)\M' then
    v := array_append(v, 'competencia_pigmentos_masterbatch_aditivos');
  end if;
  -- Datos de contacto para saltarse la mensajería
  if t ~ '(\+?52\s?)?(\d[\s.-]?){10}' or t ~ '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' or t ~ '(wa\.me|whats\s*app|whatsapp)' then
    v := array_append(v, 'datos_contacto');
  end if;
  if array_length(v, 1) is null then
    return query select 'approve'::text, '{}'::text[], null::text;
  else
    return query select 'reject'::text, v,
      case
        when 'competencia_pigmentos_masterbatch_aditivos' = any(v)
          then 'No se permiten pigmentos, masterbatch, aditivos ni colorantes en el marketplace.'
        else 'No se permiten teléfonos, emails ni WhatsApp en la publicación: usa la mensajería interna.'
      end;
  end if;
end $$;

-- Enviar producto a revisión: única vía para publicar (SECURITY DEFINER).
create or replace function public.mkt_submit_product(p_product_id bigint)
returns text
language plpgsql security definer set search_path = public as $$
declare
  prod record;
  mod record;
begin
  select * into prod from mkt_products where id = p_product_id and owner_id = auth.uid();
  if not found then
    raise exception 'Producto no encontrado o sin permiso';
  end if;
  if prod.status = 'blocked' then
    raise exception 'Producto bloqueado por administración';
  end if;

  select * into mod from mkt_moderate_text(prod.title || ' ' || prod.description);

  if mod.verdict = 'approve' then
    update mkt_products set status = 'published', reject_reason = null, updated_at = now() where id = p_product_id;
  else
    update mkt_products set status = 'rejected', reject_reason = mod.reason, updated_at = now() where id = p_product_id;
  end if;

  insert into mkt_moderation_events (product_id, verdict, violations, reason, source)
  values (p_product_id, mod.verdict, mod.violations, mod.reason, 'rules');

  return mod.verdict;
end $$;

-- ============ LÍMITES DEL PLAN (en BD, no solo UI) ============

create or replace function public.mkt_enforce_product_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  n int;
  user_plan text;
begin
  select plan into user_plan from mkt_profiles where id = new.owner_id;
  if user_plan = 'free' then
    select count(*) into n from mkt_products where owner_id = new.owner_id;
    if n >= 5 then
      raise exception 'mkt_product_limit: plan gratuito permite máximo 5 productos';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists mkt_product_limit_trg on public.mkt_products;
create trigger mkt_product_limit_trg before insert on public.mkt_products
  for each row execute function public.mkt_enforce_product_limit();

create or replace function public.mkt_enforce_photo_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select count(*) into n from mkt_product_photos where product_id = new.product_id;
  if n >= 5 then
    raise exception 'mkt_photo_limit: máximo 5 fotos por producto';
  end if;
  return new;
end $$;

drop trigger if exists mkt_photo_limit_trg on public.mkt_product_photos;
create trigger mkt_photo_limit_trg before insert on public.mkt_product_photos
  for each row execute function public.mkt_enforce_photo_limit();

-- ============ MENSAJES: moderación + last_message_at ============

create or replace function public.mkt_moderate_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare mod record;
begin
  select * into mod from mkt_moderate_text(new.body);
  if mod.verdict <> 'approve' then
    new.status := 'rejected';
  end if;
  return new;
end $$;

drop trigger if exists mkt_message_moderation_trg on public.mkt_messages;
create trigger mkt_message_moderation_trg before insert on public.mkt_messages
  for each row execute function public.mkt_moderate_message();

create or replace function public.mkt_touch_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'delivered' then
    update mkt_conversations set last_message_at = now() where id = new.conversation_id;
  else
    insert into mkt_moderation_events (message_id, verdict, violations, reason, source)
    values (new.id, 'reject', '{mensaje}', 'Mensaje bloqueado por reglas de contenido', 'rules');
  end if;
  return new;
end $$;

drop trigger if exists mkt_message_touch_trg on public.mkt_messages;
create trigger mkt_message_touch_trg after insert on public.mkt_messages
  for each row execute function public.mkt_touch_conversation();

-- ============ RLS ============

alter table public.mkt_profiles enable row level security;
alter table public.mkt_products enable row level security;
alter table public.mkt_product_photos enable row level security;
alter table public.mkt_conversations enable row level security;
alter table public.mkt_messages enable row level security;
alter table public.mkt_moderation_events enable row level security;
alter table public.mkt_search_queries enable row level security;

-- Perfiles: lectura pública, escritura propia
create policy "mkt_profiles_select" on public.mkt_profiles for select using (true);
create policy "mkt_profiles_insert" on public.mkt_profiles for insert with check (id = auth.uid());
create policy "mkt_profiles_update" on public.mkt_profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- El plan solo lo cambia el backend (Stripe webhook en F5), nunca el usuario
create or replace function public.mkt_protect_plan()
returns trigger language plpgsql as $$
begin
  if new.plan is distinct from old.plan and current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'mkt_plan_protected: el plan no puede modificarse desde el cliente';
  end if;
  if new.is_blocked is distinct from old.is_blocked and current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'mkt_blocked_protected';
  end if;
  return new;
end $$;

drop trigger if exists mkt_protect_plan_trg on public.mkt_profiles;
create trigger mkt_protect_plan_trg before update on public.mkt_profiles
  for each row execute function public.mkt_protect_plan();

-- Productos: público ve publicados; dueño ve/edita los suyos.
-- El estado 'published' SOLO lo pone mkt_submit_product (security definer):
-- el dueño únicamente puede escribir draft/paused/(pending vía rpc).
create policy "mkt_products_select" on public.mkt_products for select
  using (status = 'published' or owner_id = auth.uid());
create policy "mkt_products_insert" on public.mkt_products for insert
  with check (owner_id = auth.uid() and status = 'draft');
create policy "mkt_products_update" on public.mkt_products for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and status in ('draft', 'paused'));
create policy "mkt_products_delete" on public.mkt_products for delete using (owner_id = auth.uid());

-- Fotos: lectura pública (bucket público); escritura del dueño del producto
create policy "mkt_photos_select" on public.mkt_product_photos for select using (true);
create policy "mkt_photos_insert" on public.mkt_product_photos for insert
  with check (exists (select 1 from public.mkt_products p where p.id = product_id and p.owner_id = auth.uid()));
create policy "mkt_photos_delete" on public.mkt_product_photos for delete
  using (exists (select 1 from public.mkt_products p where p.id = product_id and p.owner_id = auth.uid()));

-- Conversaciones y mensajes: solo participantes
create policy "mkt_conversations_select" on public.mkt_conversations for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());
create policy "mkt_conversations_insert" on public.mkt_conversations for insert
  with check (buyer_id = auth.uid());
create policy "mkt_messages_select" on public.mkt_messages for select
  using (exists (select 1 from public.mkt_conversations c where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())));
create policy "mkt_messages_insert" on public.mkt_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (select 1 from public.mkt_conversations c where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid()))
  );

-- Moderación: el dueño puede ver los eventos de sus productos (transparencia)
create policy "mkt_moderation_select" on public.mkt_moderation_events for select
  using (exists (select 1 from public.mkt_products p where p.id = product_id and p.owner_id = auth.uid()));

-- Búsquedas: cualquiera inserta (log de demanda), nadie lee desde el cliente
create policy "mkt_search_insert" on public.mkt_search_queries for insert with check (true);

-- ============ STORAGE ============

insert into storage.buckets (id, name, public)
values ('mkt-photos', 'mkt-photos', true)
on conflict (id) do nothing;

create policy "mkt_photos_public_read" on storage.objects for select
  using (bucket_id = 'mkt-photos');
create policy "mkt_photos_owner_write" on storage.objects for insert
  with check (bucket_id = 'mkt-photos' and auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "mkt_photos_owner_update" on storage.objects for update
  using (bucket_id = 'mkt-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "mkt_photos_owner_delete" on storage.objects for delete
  using (bucket_id = 'mkt-photos' and (storage.foldername(name))[1] = auth.uid()::text);
