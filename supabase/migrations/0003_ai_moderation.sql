-- Fase 2: AI watcher
-- mkt_submit_product ahora solo encola para revisión;
-- la Edge Function 'moderate-product' hace la clasificación real.

-- Añadir columnas de metadata de moderación IA
alter table public.mkt_moderation_events
  add column if not exists confidence numeric(4,3),
  add column if not exists model text;

-- Simplificar mkt_submit_product: delega moderación a la Edge Function.
-- Sigue siendo SECURITY DEFINER para ser la única vía válida de cambio de estado.
create or replace function public.mkt_submit_product(p_product_id bigint)
returns text
language plpgsql security definer set search_path = public as $$
declare
  prod record;
begin
  select * into prod from mkt_products where id = p_product_id and owner_id = auth.uid();
  if not found then
    raise exception 'Producto no encontrado o sin permiso';
  end if;
  if prod.status = 'blocked' then
    raise exception 'Producto bloqueado por administración';
  end if;
  update mkt_products
    set status = 'pending_review', reject_reason = null, updated_at = now()
    where id = p_product_id;
  return 'pending';
end $$;

-- La Edge Function usa service_role y actualiza status directamente (bypasses RLS intencionalmente).
-- Para que service_role pueda publicar, crear helper explícito (auditable):
create or replace function public.mkt_apply_moderation_verdict(
  p_product_id bigint,
  p_status text,
  p_reason text default null
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  -- Solo service_role puede llamar esta función
  if current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'mkt_admin_only';
  end if;
  if p_status not in ('published', 'rejected', 'pending_review') then
    raise exception 'Estado inválido: %', p_status;
  end if;
  update mkt_products
    set status = p_status,
        reject_reason = p_reason,
        updated_at = now()
    where id = p_product_id;
end $$;

revoke execute on function public.mkt_apply_moderation_verdict from public, anon, authenticated;
