-- 0013 — Endurece el webhook de Stripe: deduplicación de eventos, orden de
-- llegada y detección fiable de service_role.

-- ---------------------------------------------------------------------------
-- 1. Detección de service_role
--
-- El trigger de 0011 comprobaba solo `request.jwt.claim.role`, una ruta de claim
-- legacy de PostgREST. Si el runtime no la puebla, el webhook (que corre con la
-- service_role key) chocaría contra su propia protección y no podría escribir el
-- plan: el pago se cobraría y el usuario se quedaría en free. Como Stripe aún no
-- está configurado, ese camino nunca se ha ejercitado.
--
-- Este helper acepta cualquiera de las formas en que el rol puede llegar.
create or replace function public.mkt_is_service_role()
returns boolean language plpgsql stable security definer set search_path = public as $$
declare claims jsonb;
begin
  if current_user = 'service_role' then return true; end if;
  if current_setting('role', true) = 'service_role' then return true; end if;
  if current_setting('request.jwt.claim.role', true) = 'service_role' then return true; end if;

  begin
    claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  exception when others then
    claims := null;
  end;
  return coalesce(claims ->> 'role', '') = 'service_role';
end $$;

create or replace function public.mkt_protect_company_admin_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.mkt_is_service_role() then
    return new;
  end if;

  if new.plan is distinct from old.plan then
    raise exception 'mkt_plan_protected: el plan no puede modificarse desde el cliente';
  end if;
  if new.stripe_customer_id is distinct from old.stripe_customer_id then
    raise exception 'mkt_stripe_protected: stripe_customer_id solo modificable por el sistema';
  end if;
  if new.stripe_subscription_id is distinct from old.stripe_subscription_id then
    raise exception 'mkt_stripe_protected: stripe_subscription_id solo modificable por el sistema';
  end if;

  return new;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Deduplicación de eventos
--
-- Stripe reintenta la entrega ante cualquier fallo o timeout, así que el mismo
-- event.id puede llegar varias veces. El id es la clave primaria: el webhook
-- inserta antes de procesar y, si ya existía, sale sin repetir efectos.
create table if not exists public.mkt_stripe_events (
  id               text primary key,
  type             text not null,
  event_created_at timestamptz not null,
  processed_at     timestamptz not null default now()
);

alter table public.mkt_stripe_events enable row level security;
-- Sin políticas a propósito: solo service_role (que hace bypass de RLS) la toca.

-- ---------------------------------------------------------------------------
-- 3. Orden de llegada
--
-- Stripe no garantiza el orden. Un `customer.subscription.updated` con estado
-- activo que llegue después de un `deleted` resucitaría el plan Pro. Guardamos
-- la marca del último evento aplicado y descartamos los más antiguos.
alter table public.mkt_companies
  add column if not exists stripe_event_at timestamptz;

comment on column public.mkt_companies.stripe_event_at is
  'Marca del último evento de Stripe aplicado. Los eventos anteriores se descartan.';

-- Aplica un cambio de plan solo si el evento es más reciente que el último
-- aplicado. Va en una función (como el resto de transiciones de estado del
-- proyecto) para que la comprobación y la escritura sean atómicas.
--
-- Localiza la empresa por id o por stripe_customer_id, según qué traiga el
-- evento. Devuelve true si aplicó el cambio, false si lo descartó por antiguo
-- o por no encontrar la empresa.
create or replace function public.mkt_apply_stripe_event(
  p_event_at        timestamptz,
  p_plan            text,
  p_company_id      uuid    default null,
  p_customer_id     text    default null,
  p_subscription_id text    default null,
  p_clear_subscription boolean default false
)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  target uuid;
begin
  if p_plan not in ('free', 'pro') then
    raise exception 'mkt_stripe_plan_invalido: %', p_plan;
  end if;

  -- FOR UPDATE serializa eventos concurrentes de la misma empresa.
  select id into target from mkt_companies
    where (p_company_id is not null and id = p_company_id)
       or (p_company_id is null and p_customer_id is not null
           and stripe_customer_id = p_customer_id)
    for update;

  if target is null then
    return false;
  end if;

  -- Stripe no garantiza el orden: descartamos lo que llegue con retraso.
  -- `event.created` tiene resolución de segundo, así que dos eventos distintos
  -- del mismo segundo se aplican los dos y gana el último en llegar. Es un
  -- residuo aceptable: la deduplicación por id ya cubre el caso frecuente
  -- (reintentos del mismo evento).
  if exists (
    select 1 from mkt_companies
    where id = target and stripe_event_at is not null and stripe_event_at > p_event_at
  ) then
    return false;
  end if;

  update mkt_companies set
    plan = p_plan,
    stripe_customer_id = coalesce(p_customer_id, stripe_customer_id),
    stripe_subscription_id = case
      when p_clear_subscription then null
      else coalesce(p_subscription_id, stripe_subscription_id)
    end,
    stripe_event_at = p_event_at
  where id = target;

  return true;
end $$;

revoke all on function public.mkt_apply_stripe_event(
  timestamptz, text, uuid, text, text, boolean
) from public, anon, authenticated;
