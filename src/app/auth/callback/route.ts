import { type NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

// Callback de magic link / confirmación de email (PKCE)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/panel";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/panel";

  if (code) {
    const successResponse = NextResponse.redirect(`${origin}${safeNext}`);
    const supabase = createRouteClient(request, successResponse);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return successResponse;
    console.error("[auth/callback] exchangeCodeForSession error:", JSON.stringify(error));
  }

  return NextResponse.redirect(`${origin}/ingresar?error=enlace-invalido`);
}
