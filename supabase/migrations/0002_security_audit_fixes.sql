-- Auditoría 2026-07-26: correcciones de seguridad e integridad

-- ============ 1. Privacidad del teléfono (crítico) ============
-- El teléfono era legible por cualquiera vía API pese a prometerse privado.
-- Grants por columna: el público solo ve columnas públicas; el dueño lee su ficha completa vía RPC.
revoke select on public.mkt_profiles from anon, authenticated;
grant select (id, company_name, slug, description, zone, logo_path, plan, is_blocked, created_at)
  on public.mkt_profiles to anon, authenticated;

create or replace function public.mkt_my_profile()
returns public.mkt_profiles
language sql security definer set search_path = public as $$
  select * from mkt_profiles where id = auth.uid();
$$;
revoke execute on function public.mkt_my_profile() from public, anon;
grant execute on function public.mkt_my_profile() to authenticated;

-- ============ 2. Validación de path en fotos (alto) ============
drop policy if exists "mkt_photos_insert" on public.mkt_product_photos;
create policy "mkt_photos_insert" on public.mkt_product_photos for insert
  with check (
    exists (select 1 from public.mkt_products p where p.id = product_id and p.owner_id = auth.uid())
    and path like auth.uid()::text || '/' || product_id::text || '/%'
  );

-- ============ 3. Integridad y anti-spam de conversaciones (alto) ============
create or replace function public.mkt_validate_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if new.product_id is not null then
    if not exists (select 1 from mkt_products p where p.id = new.product_id and p.owner_id = new.seller_id) then
      raise exception 'mkt_conversation_invalid: el vendedor no corresponde al producto';
    end if;
  end if;
  select count(*) into n from mkt_conversations
    where buyer_id = new.buyer_id and created_at > now() - interval '1 day';
  if n >= 20 then
    raise exception 'mkt_conversation_limit: máximo 20 conversaciones nuevas por día';
  end if;
  return new;
end $$;

drop trigger if exists mkt_conversation_validate_trg on public.mkt_conversations;
create trigger mkt_conversation_validate_trg before insert on public.mkt_conversations
  for each row execute function public.mkt_validate_conversation();

-- ============ 4. Regex de teléfonos: menos falsos positivos (medio) ============
-- La versión anterior rechazaba fichas con varias medidas ("1200 500 300 40").
create or replace function public.mkt_moderate_text(p_text text)
returns table (verdict text, violations text[], reason text)
language plpgsql immutable set search_path = public as $$
declare
  t text := lower(coalesce(p_text, ''));
  v text[] := '{}';
begin
  if t ~ '\m(pigmentos?|masterbatch|master\s*batch|aditivos?|colorantes?|concentrados?\s+de\s+color)\M' then
    v := array_append(v, 'competencia_pigmentos_masterbatch_aditivos');
  end if;
  if t ~ '\+?52[\s.-]?\d{10}'
     or t ~ '\m\d{10}\M'
     or t ~ '\m\d{2,3}[\s.-]\d{3,4}[\s.-]\d{4}\M'
     or t ~ '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
     or t ~ '(wa\.me|whats\s*app|whatsapp)' then
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

-- ============ 5. Superficie RPC: funciones internas no ejecutables desde la API (medio) ============
revoke execute on function public.mkt_enforce_photo_limit() from public, anon, authenticated;
revoke execute on function public.mkt_enforce_product_limit() from public, anon, authenticated;
revoke execute on function public.mkt_moderate_message() from public, anon, authenticated;
revoke execute on function public.mkt_touch_conversation() from public, anon, authenticated;
revoke execute on function public.mkt_protect_plan() from public, anon, authenticated;
revoke execute on function public.mkt_validate_conversation() from public, anon, authenticated;
revoke execute on function public.mkt_moderate_text(text) from public, anon, authenticated;
revoke execute on function public.mkt_submit_product(bigint) from public, anon;
grant execute on function public.mkt_submit_product(bigint) to authenticated;

-- search_path fijo también en mkt_protect_plan (advisor)
create or replace function public.mkt_protect_plan()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.plan is distinct from old.plan and current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'mkt_plan_protected: el plan no puede modificarse desde el cliente';
  end if;
  if new.is_blocked is distinct from old.is_blocked and current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'mkt_blocked_protected';
  end if;
  return new;
end $$;

-- ============ 6. Storage: impedir listado del bucket público (medio) ============
-- Las URLs públicas de objetos no necesitan política SELECT; solo habilitaba listar todo.
drop policy if exists "mkt_photos_public_read" on storage.objects;
