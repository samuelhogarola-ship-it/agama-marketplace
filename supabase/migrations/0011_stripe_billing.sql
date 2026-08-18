-- Stripe billing: customer_id y subscription_id en mkt_companies
-- Solo modificables por service_role (webhook de Stripe)

ALTER TABLE public.mkt_companies
  ADD COLUMN IF NOT EXISTS stripe_customer_id     text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE;

-- Index para lookup rápido por customer_id en el webhook
CREATE INDEX IF NOT EXISTS mkt_companies_stripe_customer_idx
  ON public.mkt_companies (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Los usuarios no pueden escribir directamente stripe_customer_id ni stripe_subscription_id.
-- El trigger existente (mkt_protect_company_admin_fields_trg) ya protege campos admin;
-- extenderlo para incluir los campos de Stripe.
CREATE OR REPLACE FUNCTION public.mkt_protect_company_admin_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Campos que solo service_role puede modificar
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    RAISE EXCEPTION 'mkt_plan_protected: el plan no puede modificarse desde el cliente';
  END IF;
  IF NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id THEN
    RAISE EXCEPTION 'mkt_stripe_protected: stripe_customer_id solo modificable por el sistema';
  END IF;
  IF NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id THEN
    RAISE EXCEPTION 'mkt_stripe_protected: stripe_subscription_id solo modificable por el sistema';
  END IF;

  RETURN NEW;
END;
$$;
