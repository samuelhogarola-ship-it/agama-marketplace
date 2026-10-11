"use server";

import { headers } from "next/headers";
import { resolveAuthOrigin, sanitizeAuthNext } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

type EmailLinkResult = { ok: true } | { ok: false; error: string };

async function getAuthOrigin() {
  const requestHeaders = await headers();
  return resolveAuthOrigin({
    nodeEnv: process.env.NODE_ENV,
    configuredSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    forwardedHost: requestHeaders.get("x-forwarded-host"),
    forwardedProto: requestHeaders.get("x-forwarded-proto"),
    host: requestHeaders.get("host"),
  });
}

export async function sendMagicLink(email: string, requestedNext: string): Promise<EmailLinkResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { ok: false, error: "Introduce un email válido." };

  const origin = await getAuthOrigin();
  const next = sanitizeAuthNext(requestedNext, "/panel");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      shouldCreateUser: false,
    },
  });

  if (error) {
    console.error("[auth/magic-link] send failed:", JSON.stringify(error));
    return { ok: false, error: "No se pudo enviar el enlace. Verifica el email e inténtalo de nuevo." };
  }

  return { ok: true };
}

export async function sendRecoveryLink(email: string): Promise<EmailLinkResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { ok: false, error: "Introduce un email válido." };

  const origin = await getAuthOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/panel/ajustes")}`,
  });

  if (error) {
    console.error("[auth/recovery] send failed:", JSON.stringify(error));
    return { ok: false, error: "No se pudo enviar el correo. Verifica el email e inténtalo de nuevo." };
  }

  return { ok: true };
}
