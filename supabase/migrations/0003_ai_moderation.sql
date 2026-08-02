-- Fase 2: AI watcher
-- mkt_submit_product ahora solo encola para revisión;
-- la Edge Function 'moderate-product' hace la clasificación real.

-- Añadir columnas de metadata de moderación IA
alter table public.mkt_moderation_events
  add column if not exists confidence numeric(4,3),
  add column if not exists model text;

-- mkt_submit_product acepta veredicto externo del API route de Next.js.
-- Sigue siendo SECURITY DEFINER: única vía para set status=published/rejected.
create or replace function public.mkt_submit_product(
  p_product_id bigint,
  p_verdict text default 'approve',
  p_reason text default null
)
returns text
language plpgsql security definer set search_path = public as $$
declare
  prod record;
begin
  select * into prod from mkt_products where id = p_product_id and owner_id = auth.uid();
  if not found then raise exception 'Producto no encontrado o sin permiso'; end if;
  if prod.status = 'blocked' then raise exception 'Producto bloqueado por administración'; end if;
  if p_verdict not in ('approve', 'reject', 'pending') then
    raise exception 'Veredicto inválido: %', p_verdict;
  end if;
  case p_verdict
    when 'approve' then
      update mkt_products set status = 'published', reject_reason = null, updated_at = now() where id = p_product_id;
    when 'reject' then
      update mkt_products set status = 'rejected', reject_reason = p_reason, updated_at = now() where id = p_product_id;
    else
      update mkt_products set status = 'pending_review', reject_reason = null, updated_at = now() where id = p_product_id;
  end case;
  return p_verdict;
end $$;

