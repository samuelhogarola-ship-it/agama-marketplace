-- Evita valoraciones IA duplicadas y hace que cualquier cambio de fotos
-- invalide la recomendación almacenada para el anuncio.

create table if not exists public.mkt_ai_review_claims (
  listing_id         bigint primary key references public.mkt_listings(id) on delete cascade,
  listing_updated_at timestamptz not null,
  owner_token        uuid not null,
  claimed_at         timestamptz not null default now()
);

alter table public.mkt_ai_review_claims
  add column if not exists owner_token uuid;
delete from public.mkt_ai_review_claims where owner_token is null;
alter table public.mkt_ai_review_claims alter column owner_token set not null;

alter table public.mkt_moderation_events
  add column if not exists reviewed_listing_updated_at timestamptz;

alter table public.mkt_ai_review_claims enable row level security;
-- Sin políticas: solo se accede mediante las funciones de service_role.

drop function if exists public.mkt_claim_ai_review(bigint, timestamptz);
create or replace function public.mkt_claim_ai_review(
  p_listing_id bigint,
  p_listing_updated_at timestamptz,
  p_owner_token uuid
)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  did_claim boolean;
begin
  if not public.mkt_is_service_role() then
    raise exception 'Solo service_role puede reservar una valoración IA';
  end if;

  insert into public.mkt_ai_review_claims
    (listing_id, listing_updated_at, owner_token, claimed_at)
  values
    (p_listing_id, p_listing_updated_at, p_owner_token, now())
  on conflict (listing_id) do update
    set listing_updated_at = excluded.listing_updated_at,
        owner_token = excluded.owner_token,
        claimed_at = excluded.claimed_at
    where public.mkt_ai_review_claims.claimed_at < now() - interval '5 minutes'
       or public.mkt_ai_review_claims.listing_updated_at is distinct from excluded.listing_updated_at;

  get diagnostics did_claim = row_count;
  return did_claim;
end $$;

drop function if exists public.mkt_release_ai_review_claim(bigint, timestamptz);
create or replace function public.mkt_release_ai_review_claim(
  p_listing_id bigint,
  p_listing_updated_at timestamptz,
  p_owner_token uuid
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.mkt_is_service_role() then
    raise exception 'Solo service_role puede liberar una valoración IA';
  end if;

  delete from public.mkt_ai_review_claims
  where listing_id = p_listing_id
    and listing_updated_at = p_listing_updated_at
    and owner_token = p_owner_token;
end $$;

revoke all on function public.mkt_claim_ai_review(bigint, timestamptz, uuid)
  from public, anon, authenticated;
grant execute on function public.mkt_claim_ai_review(bigint, timestamptz, uuid)
  to service_role;

revoke all on function public.mkt_release_ai_review_claim(bigint, timestamptz, uuid)
  from public, anon, authenticated;
grant execute on function public.mkt_release_ai_review_claim(bigint, timestamptz, uuid)
  to service_role;

create or replace function public.mkt_renew_ai_review_claim(
  p_listing_id bigint,
  p_listing_updated_at timestamptz,
  p_owner_token uuid
)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.mkt_is_service_role() then
    raise exception 'Solo service_role puede renovar una valoración IA';
  end if;

  update public.mkt_ai_review_claims
  set claimed_at = now()
  where listing_id = p_listing_id
    and listing_updated_at = p_listing_updated_at
    and owner_token = p_owner_token;

  return found;
end $$;

revoke all on function public.mkt_renew_ai_review_claim(bigint, timestamptz, uuid)
  from public, anon, authenticated;
grant execute on function public.mkt_renew_ai_review_claim(bigint, timestamptz, uuid)
  to service_role;

create or replace function public.mkt_save_ai_review(
  p_listing_id bigint,
  p_listing_updated_at timestamptz,
  p_owner_token uuid,
  p_verdict text,
  p_violations text[],
  p_reason text,
  p_confidence numeric,
  p_model text
)
returns text
language plpgsql security definer set search_path = public as $$
declare
  current_updated_at timestamptz;
begin
  if not public.mkt_is_service_role() then
    raise exception 'Solo service_role puede guardar una valoración IA';
  end if;

  perform 1 from public.mkt_ai_review_claims
  where listing_id = p_listing_id
    and listing_updated_at = p_listing_updated_at
    and owner_token = p_owner_token
  for update;
  if not found then
    return 'lost_claim';
  end if;

  select updated_at into current_updated_at
  from public.mkt_listings
  where id = p_listing_id and status = 'pending_review'
  for update;
  if not found or current_updated_at is distinct from p_listing_updated_at then
    return 'stale';
  end if;

  insert into public.mkt_moderation_events
    (listing_id, verdict, violations, reason, source, confidence, model, reviewed_listing_updated_at)
  values
    (p_listing_id, p_verdict, p_violations, p_reason, 'ai', p_confidence, p_model, p_listing_updated_at);

  return 'saved';
end $$;

revoke all on function public.mkt_save_ai_review(
  bigint, timestamptz, uuid, text, text[], text, numeric, text
) from public, anon, authenticated;
grant execute on function public.mkt_save_ai_review(
  bigint, timestamptz, uuid, text, text[], text, numeric, text
) to service_role;

create or replace function public.mkt_touch_listing_after_photo_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    update public.mkt_listings set updated_at = clock_timestamp() where id = old.listing_id;
    return old;
  end if;

  update public.mkt_listings set updated_at = clock_timestamp() where id = new.listing_id;
  if tg_op = 'UPDATE' and old.listing_id is distinct from new.listing_id then
    update public.mkt_listings set updated_at = clock_timestamp() where id = old.listing_id;
  end if;

  return new;
end $$;

revoke all on function public.mkt_touch_listing_after_photo_change()
  from public, anon, authenticated;

drop trigger if exists mkt_touch_listing_after_photo_change
  on public.mkt_listing_photos;
create trigger mkt_touch_listing_after_photo_change
after insert or update or delete on public.mkt_listing_photos
for each row execute function public.mkt_touch_listing_after_photo_change();
