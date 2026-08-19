import { NextRequest, NextResponse } from "next/server";
import { checkOrigin } from "@/lib/csrf";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

const PRICE_ID = process.env.STRIPE_PRO_PRICE_ID;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://todo-plastico.com";

export async function POST(req: NextRequest) {
  const originError = checkOrigin(req);
  if (originError) return originError;

  if (!PRICE_ID) {
    return NextResponse.json({ error: "Plan Pro no disponible aún." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: company } = await supabase
    .from("mkt_companies")
    .select("id, plan, stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (company?.plan === "pro") {
    return NextResponse.json({ error: "Ya tienes el plan Pro." }, { status: 400 });
  }

  const stripe = getStripe();

  // Reutilizar customer de Stripe si existe
  let customerId: string | undefined = company?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    subscription_data: { trial_period_days: 30 },
    success_url: `${SITE_URL}/panel?upgrade=success`,
    cancel_url: `${SITE_URL}/panel`,
    metadata: { supabase_user_id: user.id },
    locale: "es",
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
