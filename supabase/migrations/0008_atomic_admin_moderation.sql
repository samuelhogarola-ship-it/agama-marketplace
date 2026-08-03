-- Decision de moderacion admin atomica: cambio de estado y auditoria en la misma transaccion.

create or replace function public.mkt_admin_decide_listing(
  p_listing_id bigint,
  p_decision text,
  p_reason text default null,
  p_admin_id text default null
)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  new_status text;
begin
  if current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'Solo service_role puede decidir moderacion';
  end if;
  if p_decision not in ('approve', 'reject') then
    raise exception 'Decision invalida';
  end if;
  if p_decision = 'reject' and nullif(trim(coalesce(p_reason, '')), '') is null then
    raise exception 'El rechazo requiere motivo';
  end if;

  new_status := case when p_decision = 'approve' then 'published' else 'rejected' end;
  update public.mkt_listings
  set status = new_status,
      rejection_reason = case when new_status = 'rejected' then trim(p_reason) else null end,
      updated_at = now()
  where id = p_listing_id and status = 'pending_review';

  if not found then return false; end if;

  insert into public.mkt_moderation_events
    (listing_id, verdict, violations, reason, source, confidence, model)
  values
    (p_listing_id, p_decision, '{}', nullif(trim(p_reason), ''), 'human', 1.0, coalesce('admin:' || p_admin_id, 'admin'));
  return true;
end $$;

revoke execute on function public.mkt_admin_decide_listing(bigint, text, text, text) from public, anon, authenticated;
grant execute on function public.mkt_admin_decide_listing(bigint, text, text, text) to service_role;
