-- Campos comerciales obligatorios para anuncios.

alter table public.mkt_listings
  add column if not exists min_purchase_qty integer not null default 1;

update public.mkt_listings
set
  price_mxn = coalesce(price_mxn, 0),
  unit = case when unit in ('unidad', 'kg', 'g') then unit else 'unidad' end,
  min_purchase_qty = greatest(coalesce(min_purchase_qty, 1), 1),
  location = coalesce(nullif(trim(location), ''), 'México');

alter table public.mkt_listings
  alter column price_mxn set not null,
  alter column unit set not null,
  alter column location set not null,
  alter column min_purchase_qty set not null,
  drop constraint if exists mkt_listings_price_required,
  add constraint mkt_listings_price_required check (price_mxn >= 0),
  drop constraint if exists mkt_listings_unit_allowed,
  add constraint mkt_listings_unit_allowed check (unit in ('unidad', 'kg', 'g')),
  drop constraint if exists mkt_listings_min_purchase_qty_required,
  add constraint mkt_listings_min_purchase_qty_required check (min_purchase_qty >= 1),
  drop constraint if exists mkt_listings_location_required,
  add constraint mkt_listings_location_required check (char_length(trim(location)) >= 2);
