import { type NextRequest, NextResponse } from "next/server";
import { authenticateAuthCallback } from "@/lib/auth-callback";
import { createRouteClient } from "@/lib/supabase/server";

// Callback de magic link / confirmación de email (PKCE)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  const next = searchParams.get("next") ?? "/panel";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/panel";

  const successResponse = NextResponse.redirect(`${origin}${safeNext}`);
  const supabase = createRouteClient(request, successResponse);
  const result = await authenticateAuthCallback(searchParams, supabase.auth);

  if (result.ok) return successResponse;
  if (result.error) {
    console.error(
      `[auth/callback] ${result.method ?? "unknown"} verification error:`,
      JSON.stringify(result.error),
    );
  }

  return NextResponse.redirect(`${origin}/ingresar?error=enlace-invalido`);
}
