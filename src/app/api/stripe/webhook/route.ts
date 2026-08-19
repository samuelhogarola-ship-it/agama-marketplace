import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      if (!userId || session.mode !== "subscription") break;

      await supabase
        .from("mkt_companies")
        .update({
          plan: "pro",
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
        })
        .eq("id", userId);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      await supabase
        .from("mkt_companies")
        .update({ plan: "free", stripe_subscription_id: null })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const active = sub.status === "active" || sub.status === "trialing";

      await supabase
        .from("mkt_companies")
        .update({ plan: active ? "pro" : "free" })
        .eq("stripe_customer_id", customerId);
      break;
    }

    default:
      // Evento ignorado
      break;
  }

  return NextResponse.json({ received: true });
}

// App Router lee el body como stream — req.text() ya devuelve el raw body
