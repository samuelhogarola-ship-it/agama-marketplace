-- TodoPlastico Fase 1: directorio B2B gratuito, contacto externo y anuncios.

-- ============ Eliminar mensajeria interna fuera de Fase 1 ============
drop table if exists public.mkt_messages cascade;
drop table if exists public.mkt_conversations cascade;
drop function if exists public.mkt_moderate_message() cascade;
drop function if exists public.mkt_touch_conversation() cascade;
drop function if exists public.mkt_validate_conversation() cascade;

-- ============ Renombrar tablas base ============
alter table if exists public.mkt_profiles rename to mkt_companies;
alter table if exists public.mkt_products rename to mkt_listings;
alter table if exists public.mkt_product_photos rename to mkt_listing_photos;

-- ============ Empresas ============
alter table public.mkt_companies rename column company_name to name;
alter table public.mkt_companies rename column zone to location;
alter table public.mkt_companies rename column logo_path to logo_url;

alter table public.mkt_companies
  add column if not exists website text,
  add column if not exists email text,
  add column if not exists whatsapp text,
  add column if not exists categories text[] not null default '{}',
  add column if not exists is_verified boolean not null default false,
  add column if not exists is_featured boolean not null default false,
  add column if not exists status text not null default 'active' check (status in ('active', 'blocked')),
  add column if not exists updated_at timestamptz not null default now();

update public.mkt_companies
set status = case when coalesce(is_blocked, false) then 'blocked' else 'active' end
where status is null or status = 'active';

alter table public.mkt_companies
  drop constraint if exists mkt_profiles_company_name_check,
  add constraint mkt_companies_name_len check (char_length(name) between 3 and 120);

-- ============ Anuncios ============
alter table public.mkt_listings rename column owner_id to company_id;
alter table public.mkt_listings rename column zone to location;
alter table public.mkt_listings rename column reject_reason to rejection_reason;

alter table public.mkt_listings
  add column if not exists type text not null default 'product' check (type in ('product', 'service', 'ad')),
  add column if not exists tags text[] not null default '{}',
  add column if not exists contact_override jsonb,
  add column if not exists external_url text;

alter table public.mkt_listing_photos rename column product_id to listing_id;
alter table public.mkt_listing_photos rename column path to storage_path;
alter table public.mkt_listing_photos add column if not exists alt_text text;

alter table public.mkt_moderation_events rename column product_id to listing_id;
alter table public.mkt_moderation_events drop column if exists message_id;
alter table public.mkt_moderation_events
  add column if not exists confidence numeric(4,3),
  add column if not exists model text;

-- ============ Nuevas tablas ============
create table if not exists public.mkt_categories (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  parent_id bigint references public.mkt_categories(id) on delete set null,
  icon text,
  description text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.mkt_articles (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null check (char_length(title) between 5 and 180),
  excerpt text,
  body text not null,
  category text,
  tags text[] not null default '{}',
  cover_image_url text,
  author_id uuid references public.mkt_companies(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mkt_banners (
  id bigint generated always as identity primary key,
  slot text not null,
  image_url text,
  link_url text,
  company_id uuid references public.mkt_companies(id) on delete set null,
  active boolean not null default true,
  position int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============ Indices ============
drop index if exists public.mkt_products_status_category_idx;
drop index if exists public.mkt_products_owner_idx;
drop index if exists public.mkt_photos_product_idx;
drop index if exists public.mkt_messages_conversation_idx;
drop index if exists public.mkt_conversations_buyer_idx;
drop index if exists public.mkt_conversations_seller_idx;

create index if not exists mkt_listings_status_category_idx on public.mkt_listings (status, category);
create index if not exists mkt_listings_company_idx on public.mkt_listings (company_id);
create index if not exists mkt_listing_photos_listing_idx on public.mkt_listing_photos (listing_id);
create index if not exists mkt_articles_status_published_idx on public.mkt_articles (status, published_at desc);
create index if not exists mkt_banners_slot_active_idx on public.mkt_banners (slot, active, position);

-- ============ Moderacion ============
create or replace function public.mkt_moderate_text(p_text text)
returns table (verdict text, violations text[], reason text)
language plpgsql immutable set search_path = public as $$
declare
  t text := lower(coalesce(p_text, ''));
  v text[] := '{}';
begin
  if t ~ '\m(pigmentos?|masterbatch|master\s*batch|aditivos?|colorantes?|concentrados?\s+de\s+color|estabilizantes?\s+uv|antioxidantes?|retardantes?\s+de\s+flama)\M' then
    v := array_append(v, 'competencia_pigmentos_masterbatch_aditivos');
  end if;
  if t ~ '\+?52[\s.-]?\d{10}'
     or t ~ '\m\d{10}\M'
     or t ~ '\m\d{2,3}[\s.-]\d{3,4}[\s.-]\d{4}\M'
     or t ~ '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
     or t ~ '(wa\.me|whats\s*app|whatsapp)'
     or t ~ 'https?://|www\.' then
    v := array_append(v, 'datos_contacto_en_texto');
  end if;
  if array_length(v, 1) is null then
    return query select 'approve'::text, '{}'::text[], null::text;
  else
    return query select 'reject'::text, v,
      case
        when 'competencia_pigmentos_masterbatch_aditivos' = any(v)
          then 'No se permiten pigmentos, masterbatch, aditivos ni colorantes en TodoPlastico.'
        else 'Los datos de contacto deben ir en los campos de empresa o enlace externo, no dentro del texto del anuncio.'
      end;
  end if;
end $$;

drop function if exists public.mkt_submit_product(bigint, text, text);
drop function if exists public.mkt_submit_product(bigint);

create or replace function public.mkt_submit_listing(
  p_listing_id bigint,
  p_verdict text default 'approve',
  p_reason text default null
)
returns text
language plpgsql security definer set search_path = public as $$
declare
  listing record;
begin
  select * into listing from mkt_listings where id = p_listing_id and company_id = auth.uid();
  if not found then raise exception 'Anuncio no encontrado o sin permiso'; end if;
  if listing.status = 'blocked' then raise exception 'Anuncio bloqueado por administracion'; end if;
  if p_verdict not in ('approve', 'reject', 'pending') then
    raise exception 'Veredicto invalido: %', p_verdict;
  end if;
  case p_verdict
    when 'approve' then
      update mkt_listings set status = 'published', rejection_reason = null, updated_at = now() where id = p_listing_id;
    when 'reject' then
      update mkt_listings set status = 'rejected', rejection_reason = p_reason, updated_at = now() where id = p_listing_id;
    else
      update mkt_listings set status = 'pending_review', rejection_reason = null, updated_at = now() where id = p_listing_id;
  end case;
  return p_verdict;
end $$;

-- ============ Limites ============
drop trigger if exists mkt_product_limit_trg on public.mkt_listings;
drop trigger if exists mkt_photo_limit_trg on public.mkt_listing_photos;
drop function if exists public.mkt_enforce_product_limit() cascade;
drop function if exists public.mkt_enforce_photo_limit() cascade;

create or replace function public.mkt_enforce_listing_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  n int;
  user_plan text;
begin
  select plan into user_plan from mkt_companies where id = new.company_id;
  if coalesce(user_plan, 'free') = 'free' then
    select count(*) into n from mkt_listings where company_id = new.company_id and status in ('published', 'pending_review', 'draft', 'paused');
    if n >= 5 then
      raise exception 'mkt_listing_limit: plan gratuito permite maximo 5 anuncios';
    end if;
  end if;
  return new;
end $$;

create trigger mkt_listing_limit_trg before insert on public.mkt_listings
  for each row execute function public.mkt_enforce_listing_limit();

create or replace function public.mkt_enforce_listing_photo_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select count(*) into n from mkt_listing_photos where listing_id = new.listing_id;
  if n >= 5 then
    raise exception 'mkt_photo_limit: maximo 5 fotos por anuncio';
  end if;
  if new.position > 4 then
    raise exception 'mkt_photo_position: posicion maxima 4';
  end if;
  return new;
end $$;

create trigger mkt_listing_photo_limit_trg before insert on public.mkt_listing_photos
  for each row execute function public.mkt_enforce_listing_photo_limit();

-- ============ RLS ============
alter table public.mkt_companies enable row level security;
alter table public.mkt_listings enable row level security;
alter table public.mkt_listing_photos enable row level security;
alter table public.mkt_moderation_events enable row level security;
alter table public.mkt_search_queries enable row level security;
alter table public.mkt_categories enable row level security;
alter table public.mkt_articles enable row level security;
alter table public.mkt_banners enable row level security;

drop policy if exists "mkt_profiles_select" on public.mkt_companies;
drop policy if exists "mkt_profiles_insert" on public.mkt_companies;
drop policy if exists "mkt_profiles_update" on public.mkt_companies;
drop policy if exists "mkt_products_select" on public.mkt_listings;
drop policy if exists "mkt_products_insert" on public.mkt_listings;
drop policy if exists "mkt_products_update" on public.mkt_listings;
drop policy if exists "mkt_products_delete" on public.mkt_listings;
drop policy if exists "mkt_photos_select" on public.mkt_listing_photos;
drop policy if exists "mkt_photos_insert" on public.mkt_listing_photos;
drop policy if exists "mkt_photos_delete" on public.mkt_listing_photos;
drop policy if exists "mkt_moderation_select" on public.mkt_moderation_events;

create policy "mkt_companies_select" on public.mkt_companies for select using (status = 'active' or id = auth.uid());
create policy "mkt_companies_insert" on public.mkt_companies for insert with check (id = auth.uid());
create policy "mkt_companies_update" on public.mkt_companies for update using (id = auth.uid()) with check (id = auth.uid());

-- 0002 restringió la lectura por columnas. Reabrimos solo los campos públicos del directorio.
revoke select on public.mkt_companies from anon, authenticated;
grant select (id, name, slug, description, location, logo_url, website, phone, email, whatsapp, categories, is_verified, is_featured, status, created_at, updated_at)
  on public.mkt_companies to anon, authenticated;

create policy "mkt_listings_select" on public.mkt_listings for select
  using (status = 'published' or company_id = auth.uid());
create policy "mkt_listings_insert" on public.mkt_listings for insert
  with check (company_id = auth.uid() and status = 'draft');
create policy "mkt_listings_update" on public.mkt_listings for update
  using (company_id = auth.uid())
  with check (company_id = auth.uid() and status in ('draft', 'paused', 'pending_review'));
create policy "mkt_listings_delete" on public.mkt_listings for delete using (company_id = auth.uid());

create policy "mkt_listing_photos_select" on public.mkt_listing_photos for select using (true);
create policy "mkt_listing_photos_insert" on public.mkt_listing_photos for insert
  with check (
    exists (select 1 from public.mkt_listings l where l.id = listing_id and l.company_id = auth.uid())
    and storage_path like auth.uid()::text || '/' || listing_id::text || '/%'
  );
create policy "mkt_listing_photos_delete" on public.mkt_listing_photos for delete
  using (exists (select 1 from public.mkt_listings l where l.id = listing_id and l.company_id = auth.uid()));

create policy "mkt_moderation_select" on public.mkt_moderation_events for select
  using (exists (select 1 from public.mkt_listings l where l.id = listing_id and l.company_id = auth.uid()));
create policy "mkt_moderation_insert" on public.mkt_moderation_events for insert
  with check (exists (select 1 from public.mkt_listings l where l.id = listing_id and l.company_id = auth.uid()));

create policy "mkt_categories_select" on public.mkt_categories for select using (true);
create policy "mkt_articles_select_published" on public.mkt_articles for select using (status = 'published');
create policy "mkt_banners_select_active" on public.mkt_banners for select using (
  active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

-- ============ RPC y grants ============
drop trigger if exists mkt_protect_plan_trg on public.mkt_companies;
drop function if exists public.mkt_protect_plan() cascade;

create or replace function public.mkt_protect_company_admin_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.plan is distinct from old.plan and current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'mkt_plan_protected';
  end if;
  if new.status is distinct from old.status and current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'mkt_status_protected';
  end if;
  if new.is_verified is distinct from old.is_verified and current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'mkt_verified_protected';
  end if;
  if new.is_featured is distinct from old.is_featured and current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'mkt_featured_protected';
  end if;
  return new;
end $$;

create trigger mkt_protect_company_admin_fields_trg before update on public.mkt_companies
  for each row execute function public.mkt_protect_company_admin_fields();

drop function if exists public.mkt_my_profile();
create or replace function public.mkt_my_company()
returns public.mkt_companies
language sql security definer set search_path = public as $$
  select * from mkt_companies where id = auth.uid();
$$;

revoke execute on function public.mkt_my_company() from public, anon;
grant execute on function public.mkt_my_company() to authenticated;
revoke execute on function public.mkt_submit_listing(bigint, text, text) from public, anon;
grant execute on function public.mkt_submit_listing(bigint, text, text) to authenticated;
revoke execute on function public.mkt_moderate_text(text) from public, anon, authenticated;
revoke execute on function public.mkt_enforce_listing_limit() from public, anon, authenticated;
revoke execute on function public.mkt_enforce_listing_photo_limit() from public, anon, authenticated;
revoke execute on function public.mkt_protect_company_admin_fields() from public, anon, authenticated;
