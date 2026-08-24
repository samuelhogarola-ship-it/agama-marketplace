import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

type ServiceClient = ReturnType<typeof createServiceClient>;

type ApplyPlanArgs = {
  p_event_at: string;
  p_plan: "free" | "pro";
  p_company_id?: string;
  p_customer_id?: string;
  p_subscription_id?: string;
  p_clear_subscription?: boolean;
};

/**
 * Aplica el cambio de plan vía RPC: la comprobación de orden y la escritura
 * ocurren en la misma transacción, con lock sobre la fila de la empresa.
 *
 * `ok: false` significa fallo real (hay que reintentar). Que `applied` sea false
 * con `ok: true` es un descarte legítimo: evento antiguo o empresa inexistente.
 */
async function applyPlan(
  supabase: ServiceClient,
  args: ApplyPlanArgs
): Promise<{ ok: boolean; applied: boolean }> {
  const { data, error } = await supabase.rpc("mkt_apply_stripe_event", args);
  if (error) {
    console.error("[stripe/webhook] no se pudo aplicar el plan:", error);
    return { ok: false, applied: false };
  }
  if (data !== true) {
    console.warn(
      `[stripe/webhook] evento descartado (más antiguo que el último aplicado, o empresa no encontrada): ${args.p_customer_id ?? args.p_company_id}`
    );
  }
  return { ok: true, applied: data === true };
}

export async function POST(req: NextRequest) {
  if (!WEBHOOK_SECRET) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const eventAt = new Date(event.created * 1000).toISOString();

  // Stripe reintenta la entrega ante cualquier timeout o error, así que el mismo
  // evento puede llegar varias veces. El id es PK: si el insert no devuelve fila,
  // ya lo procesamos y salimos sin repetir efectos.
  const { data: claimed, error: claimError } = await supabase
    .from("mkt_stripe_events")
    .upsert(
      { id: event.id, type: event.type, event_created_at: eventAt },
      { onConflict: "id", ignoreDuplicates: true }
    )
    .select("id");

  if (claimError) {
    console.error("[stripe/webhook] no se pudo registrar el evento:", claimError);
    // Devolvemos 500 para que Stripe reintente: es preferible a perder el evento.
    return NextResponse.json({ error: "Error al registrar el evento" }, { status: 500 });
  }
  if (!claimed?.length) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  let result: { ok: boolean; applied: boolean } = { ok: true, applied: false };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      if (!userId || session.mode !== "subscription") break;

      result = await applyPlan(supabase, {
        p_event_at: eventAt,
        p_plan: "pro",
        p_company_id: userId,
        p_customer_id: session.customer as string,
        p_subscription_id: session.subscription as string,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;

      result = await applyPlan(supabase, {
        p_event_at: eventAt,
        p_plan: "free",
        p_customer_id: sub.customer as string,
        p_clear_subscription: true,
      });
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const active = sub.status === "active" || sub.status === "trialing";

      result = await applyPlan(supabase, {
        p_event_at: eventAt,
        p_plan: active ? "pro" : "free",
        p_customer_id: sub.customer as string,
      });
      break;
    }

    default:
      // Evento ignorado
      break;
  }

  // Si el plan no se pudo escribir, soltamos la marca de procesado y pedimos a
  // Stripe que reintente. Sin esto el evento quedaría registrado pero sin efecto.
  if (!result.ok) {
    await supabase.from("mkt_stripe_events").delete().eq("id", event.id);
    return NextResponse.json({ error: "No se pudo aplicar el evento" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// App Router lee el body como stream — req.text() ya devuelve el raw body
