-- MVP foundations: ref_code, accepted_terms_at, listing expiry, RFC, tickets

-- ============ 1. ref_code único por empresa (TP-0001) ============

CREATE SEQUENCE IF NOT EXISTS mkt_company_ref_seq START 1;

ALTER TABLE public.mkt_companies
  ADD COLUMN IF NOT EXISTS ref_code text,
  ADD COLUMN IF NOT EXISTS rfc text,
  ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz;

-- Índice unique en RFC (previene duplicados de empresa)
CREATE UNIQUE INDEX IF NOT EXISTS mkt_companies_rfc_uidx
  ON public.mkt_companies (lower(rfc))
  WHERE rfc IS NOT NULL AND rfc <> '';

-- Asignar ref_code a empresas existentes
UPDATE public.mkt_companies
SET ref_code = 'TP-' || LPAD(nextval('mkt_company_ref_seq')::text, 4, '0')
WHERE ref_code IS NULL;

ALTER TABLE public.mkt_companies
  ALTER COLUMN ref_code SET NOT NULL,
  ADD CONSTRAINT mkt_companies_ref_code_unique UNIQUE (ref_code);

-- Trigger: auto-asignar ref_code en INSERT si no viene
CREATE OR REPLACE FUNCTION public.mkt_assign_ref_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.ref_code IS NULL OR NEW.ref_code = '' THEN
    NEW.ref_code := 'TP-' || LPAD(nextval('mkt_company_ref_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mkt_assign_ref_code_trg ON public.mkt_companies;
CREATE TRIGGER mkt_assign_ref_code_trg
  BEFORE INSERT ON public.mkt_companies
  FOR EACH ROW EXECUTE FUNCTION public.mkt_assign_ref_code();

-- ============ 2. Expiración de anuncios ============

ALTER TABLE public.mkt_listings
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Al aprobar un anuncio, marcar expiración a 6 meses
CREATE OR REPLACE FUNCTION public.mkt_set_listing_expiry()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status <> 'published' THEN
    NEW.expires_at := now() + INTERVAL '6 months';
  END IF;
  IF NEW.status <> 'published' THEN
    NEW.expires_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mkt_listing_expiry_trg ON public.mkt_listings;
CREATE TRIGGER mkt_listing_expiry_trg
  BEFORE UPDATE ON public.mkt_listings
  FOR EACH ROW EXECUTE FUNCTION public.mkt_set_listing_expiry();

-- Función para pausar anuncios vencidos (llamar desde cron o endpoint)
CREATE OR REPLACE FUNCTION public.mkt_expire_listings()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cnt int;
BEGIN
  UPDATE public.mkt_listings
  SET status = 'paused', updated_at = now()
  WHERE status = 'published'
    AND expires_at IS NOT NULL
    AND expires_at < now();
  GET DIAGNOSTICS cnt = ROW_COUNT;
  RETURN cnt;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mkt_expire_listings() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mkt_expire_listings() TO service_role;

-- ============ 3. Tickets de soporte ============

CREATE SEQUENCE IF NOT EXISTS mkt_ticket_seq START 1;

CREATE TABLE IF NOT EXISTS public.mkt_tickets (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_code   text NOT NULL UNIQUE,          -- TK-0001
  company_id    uuid NOT NULL REFERENCES public.mkt_companies(id) ON DELETE CASCADE,
  category      text NOT NULL DEFAULT 'general'
                  CHECK (category IN ('facturacion', 'tecnico', 'contenido', 'cuenta', 'general')),
  subject       text NOT NULL CHECK (char_length(subject) BETWEEN 5 AND 200),
  status        text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority      text NOT NULL DEFAULT 'normal'
                  CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  resolved_at   timestamptz
);

CREATE TABLE IF NOT EXISTS public.mkt_ticket_messages (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id   bigint NOT NULL REFERENCES public.mkt_tickets(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  is_internal boolean NOT NULL DEFAULT false,  -- nota interna solo visible para admin
  body        text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-asignar ticket_code
CREATE OR REPLACE FUNCTION public.mkt_assign_ticket_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.ticket_code IS NULL OR NEW.ticket_code = '' THEN
    NEW.ticket_code := 'TK-' || LPAD(nextval('mkt_ticket_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mkt_assign_ticket_code_trg ON public.mkt_tickets;
CREATE TRIGGER mkt_assign_ticket_code_trg
  BEFORE INSERT ON public.mkt_tickets
  FOR EACH ROW EXECUTE FUNCTION public.mkt_assign_ticket_code();

-- updated_at automático en tickets
CREATE OR REPLACE FUNCTION public.mkt_touch_ticket()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.mkt_tickets SET updated_at = now() WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mkt_touch_ticket_trg ON public.mkt_ticket_messages;
CREATE TRIGGER mkt_touch_ticket_trg
  AFTER INSERT ON public.mkt_ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.mkt_touch_ticket();

-- Índices
CREATE INDEX IF NOT EXISTS mkt_tickets_company_idx  ON public.mkt_tickets (company_id);
CREATE INDEX IF NOT EXISTS mkt_tickets_status_idx   ON public.mkt_tickets (status);
CREATE INDEX IF NOT EXISTS mkt_ticket_msgs_ticket_idx ON public.mkt_ticket_messages (ticket_id);

-- ============ RLS ============

ALTER TABLE public.mkt_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mkt_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Tickets: empresa solo ve los suyos; admin ve todos
DROP POLICY IF EXISTS "mkt_tickets_select" ON public.mkt_tickets;
CREATE POLICY "mkt_tickets_select" ON public.mkt_tickets FOR SELECT
  USING (company_id = auth.uid() OR current_setting('request.jwt.claim.role', true) = 'service_role');

DROP POLICY IF EXISTS "mkt_tickets_insert" ON public.mkt_tickets;
CREATE POLICY "mkt_tickets_insert" ON public.mkt_tickets FOR INSERT
  WITH CHECK (company_id = auth.uid());

DROP POLICY IF EXISTS "mkt_tickets_update" ON public.mkt_tickets;
CREATE POLICY "mkt_tickets_update" ON public.mkt_tickets FOR UPDATE
  USING (current_setting('request.jwt.claim.role', true) = 'service_role');

-- Mensajes: empresa ve los no-internos de sus tickets; admin ve todos
DROP POLICY IF EXISTS "mkt_ticket_msgs_select" ON public.mkt_ticket_messages;
CREATE POLICY "mkt_ticket_msgs_select" ON public.mkt_ticket_messages FOR SELECT
  USING (
    current_setting('request.jwt.claim.role', true) = 'service_role'
    OR (
      is_internal = false
      AND ticket_id IN (SELECT id FROM public.mkt_tickets WHERE company_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "mkt_ticket_msgs_insert" ON public.mkt_ticket_messages;
CREATE POLICY "mkt_ticket_msgs_insert" ON public.mkt_ticket_messages FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND is_internal = false
    AND ticket_id IN (SELECT id FROM public.mkt_tickets WHERE company_id = auth.uid())
  );
