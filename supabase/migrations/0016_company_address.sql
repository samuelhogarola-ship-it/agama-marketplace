-- Dirección privada estructurada; location conserva solo municipio y estado.
-- Aditiva: las empresas antiguas pueden seguir leyendo su ficha sin dirección.
alter table public.mkt_companies add column if not exists address jsonb;
alter table public.mkt_companies add constraint mkt_company_address_valid check (
  address is null or coalesce((
    jsonb_typeof(address) = 'object'
    and address ?& array['postalCode', 'state', 'municipality', 'colony', 'street', 'exterior', 'interior']
    and jsonb_typeof(address->'postalCode') = 'string'
    and jsonb_typeof(address->'state') = 'string'
    and jsonb_typeof(address->'municipality') = 'string'
    and jsonb_typeof(address->'colony') = 'string'
    and jsonb_typeof(address->'street') = 'string'
    and jsonb_typeof(address->'exterior') = 'string'
    and jsonb_typeof(address->'interior') = 'string'
    and (address->>'postalCode') ~ '^[0-9]{5}$'
    and length(trim(address->>'state')) between 1 and 200
    and length(trim(address->>'municipality')) between 1 and 200
    and length(trim(address->>'colony')) between 1 and 200
    and length(trim(address->>'street')) between 1 and 200
    and length(trim(address->>'exterior')) between 1 and 200
    and length(address->>'interior') <= 200
  ), false)
);
-- Sin grant SELECT público: se lee exclusivamente por mkt_my_company().
notify pgrst, 'reload schema';
