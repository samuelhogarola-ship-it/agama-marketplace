-- 0012 — Cierra la carrera TOCTOU en los triggers de límite.
--
-- Los triggers de 0004 hacían `select count(*)` y luego decidían. Dos inserts
-- concurrentes de la misma empresa podían leer ambos el mismo conteo (4), pasar
-- los dos la comprobación y dejar 6 anuncios. Igual con las fotos.
--
-- La corrección toma un lock de fila sobre el "padre" (la empresa para el límite
-- de anuncios, el anuncio para el de fotos) antes de contar. El lock se mantiene
-- hasta el commit, así que las transacciones que compiten por el mismo padre se
-- serializan y la segunda cuenta ya el efecto de la primera.

create or replace function public.mkt_enforce_listing_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  n int;
  user_plan text;
begin
  -- FOR UPDATE serializa los inserts concurrentes de la misma empresa.
  select plan into user_plan from mkt_companies where id = new.company_id for update;

  if coalesce(user_plan, 'free') = 'free' then
    select count(*) into n from mkt_listings
      where company_id = new.company_id
        and status in ('published', 'pending_review', 'draft', 'paused');
    if n >= 5 then
      raise exception 'mkt_listing_limit: plan gratuito permite maximo 5 anuncios';
    end if;
  end if;
  return new;
end $$;

create or replace function public.mkt_enforce_listing_photo_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  -- Lock sobre el anuncio: serializa las subidas concurrentes de fotos.
  perform 1 from mkt_listings where id = new.listing_id for update;

  select count(*) into n from mkt_listing_photos where listing_id = new.listing_id;
  if n >= 5 then
    raise exception 'mkt_photo_limit: maximo 5 fotos por anuncio';
  end if;
  if new.position > 4 then
    raise exception 'mkt_photo_position: posicion maxima 4';
  end if;
  return new;
end $$;
