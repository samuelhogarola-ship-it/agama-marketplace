-- Contacto explícito por anuncio y enlaces limitados a la web propia del anunciante.

create or replace function public.mkt_url_host(p_url text)
returns text
language sql immutable set search_path = public as $$
  select nullif(
    regexp_replace(
      regexp_replace(
        regexp_replace(lower(trim(coalesce(p_url, ''))), '^https?://', ''),
        '/.*$',
        ''
      ),
      ':\d+$',
      ''
    ),
    ''
  );
$$;

create or replace function public.mkt_validate_listing_contact_and_url()
returns trigger
language plpgsql set search_path = public as $$
declare
  advertiser_website text;
  target_host text;
  website_host text;
  contact_method text;
  contact_value text;
begin
  contact_method := coalesce(new.contact_override->>'method', '');
  contact_value := trim(coalesce(new.contact_override->>'value', ''));

  if contact_method not in ('email', 'phone', 'whatsapp') or char_length(contact_value) < 3 then
    raise exception 'mkt_contact_required';
  end if;

  if new.external_url is not null and trim(new.external_url) <> '' then
    if new.external_url !~* '^https?://' then
      raise exception 'mkt_external_url_invalid';
    end if;

    select website into advertiser_website
    from public.mkt_companies
    where id = new.company_id;

    target_host := regexp_replace(public.mkt_url_host(new.external_url), '^www\.', '');
    website_host := regexp_replace(public.mkt_url_host(advertiser_website), '^www\.', '');

    if website_host is null
       or target_host is null
       or (target_host <> website_host and target_host not like '%.' || website_host) then
      raise exception 'mkt_external_url_must_match_company_website';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists mkt_validate_listing_contact_and_url_trg on public.mkt_listings;
create trigger mkt_validate_listing_contact_and_url_trg
  before insert or update of contact_override, external_url, company_id on public.mkt_listings
  for each row execute function public.mkt_validate_listing_contact_and_url();

revoke execute on function public.mkt_url_host(text) from public, anon, authenticated;
revoke execute on function public.mkt_validate_listing_contact_and_url() from public, anon, authenticated;
