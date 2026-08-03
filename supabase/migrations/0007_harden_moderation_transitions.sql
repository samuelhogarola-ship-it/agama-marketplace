-- Endurece las transiciones de moderacion: propietarios solo pueden enviar a revision.

create or replace function public.mkt_submit_listing(
  p_listing_id bigint,
  p_verdict text default 'pending',
  p_reason text default null
)
returns text
language plpgsql security definer set search_path = public as $$
declare
  listing record;
  is_service boolean := current_setting('request.jwt.claim.role', true) = 'service_role';
begin
  select * into listing
  from public.mkt_listings
  where id = p_listing_id
    and (company_id = auth.uid() or is_service);

  if not found then raise exception 'Anuncio no encontrado o sin permiso'; end if;
  if listing.status = 'blocked' then raise exception 'Anuncio bloqueado por administracion'; end if;
  if p_verdict not in ('approve', 'reject', 'pending') then
    raise exception 'Veredicto invalido: %', p_verdict;
  end if;
  if not is_service and p_verdict <> 'pending' then
    raise exception 'Solo administracion puede aprobar o rechazar anuncios';
  end if;

  case p_verdict
    when 'approve' then
      update public.mkt_listings
      set status = 'published', rejection_reason = null, updated_at = now()
      where id = p_listing_id;
    when 'reject' then
      update public.mkt_listings
      set status = 'rejected', rejection_reason = p_reason, updated_at = now()
      where id = p_listing_id;
    else
      update public.mkt_listings
      set status = 'pending_review', rejection_reason = null, updated_at = now()
      where id = p_listing_id;
  end case;
  return p_verdict;
end $$;

revoke execute on function public.mkt_submit_listing(bigint, text, text) from public, anon;
grant execute on function public.mkt_submit_listing(bigint, text, text) to authenticated, service_role;

-- Los eventos son un registro de auditoria. Nunca deben poder escribirlos los anunciantes.
drop policy if exists "mkt_moderation_insert" on public.mkt_moderation_events;

-- Validacion server-side de URLs de empresa para evitar esquemas inseguros.
create or replace function public.mkt_validate_company_website()
returns trigger
language plpgsql set search_path = public as $$
begin
  if new.website is not null and trim(new.website) <> '' and new.website !~* '^https?://[^[:space:]]+$' then
    raise exception 'mkt_company_website_invalid';
  end if;
  return new;
end $$;

drop trigger if exists mkt_validate_company_website_trg on public.mkt_companies;
create trigger mkt_validate_company_website_trg
  before insert or update of website on public.mkt_companies
  for each row execute function public.mkt_validate_company_website();

revoke execute on function public.mkt_validate_company_website() from public, anon, authenticated;
