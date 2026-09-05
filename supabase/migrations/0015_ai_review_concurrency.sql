-- Evita valoraciones IA duplicadas y hace que cualquier cambio de fotos
-- invalide la recomendación almacenada para el anuncio.

create table if not exists public.mkt_ai_review_claims (
  listing_id         bigint primary key references public.mkt_listings(id) on delete cascade,
  listing_updated_at timestamptz not null,
  claimed_at         timestamptz not null default now()
);

alter table public.mkt_ai_review_claims enable row level security;
-- Sin políticas: solo se accede mediante las funciones de service_role.

create or replace function public.mkt_claim_ai_review(
  p_listing_id bigint,
  p_listing_updated_at timestamptz
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
    (listing_id, listing_updated_at, claimed_at)
  values
    (p_listing_id, p_listing_updated_at, now())
  on conflict (listing_id) do update
    set listing_updated_at = excluded.listing_updated_at,
        claimed_at = excluded.claimed_at
    where public.mkt_ai_review_claims.claimed_at < now() - interval '5 minutes'
       or public.mkt_ai_review_claims.listing_updated_at is distinct from excluded.listing_updated_at;

  get diagnostics did_claim = row_count;
  return did_claim;
end $$;

create or replace function public.mkt_release_ai_review_claim(
  p_listing_id bigint,
  p_listing_updated_at timestamptz
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.mkt_is_service_role() then
    raise exception 'Solo service_role puede liberar una valoración IA';
  end if;

  delete from public.mkt_ai_review_claims
  where listing_id = p_listing_id
    and listing_updated_at = p_listing_updated_at;
end $$;

revoke all on function public.mkt_claim_ai_review(bigint, timestamptz)
  from public, anon, authenticated;
grant execute on function public.mkt_claim_ai_review(bigint, timestamptz)
  to service_role;

revoke all on function public.mkt_release_ai_review_claim(bigint, timestamptz)
  from public, anon, authenticated;
grant execute on function public.mkt_release_ai_review_claim(bigint, timestamptz)
  to service_role;

create or replace function public.mkt_touch_listing_after_photo_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    update public.mkt_listings set updated_at = now() where id = old.listing_id;
    return old;
  end if;

  update public.mkt_listings set updated_at = now() where id = new.listing_id;
  if tg_op = 'UPDATE' and old.listing_id is distinct from new.listing_id then
    update public.mkt_listings set updated_at = now() where id = old.listing_id;
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
