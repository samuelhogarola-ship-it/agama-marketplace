import { NextRequest, NextResponse } from 'next/server';
import { authenticateAuthCallback, getEmailConfirmation } from '@/lib/auth-callback';
import { confirmationHeaders, renderEmailConfirmation } from '@/lib/auth-confirmation';
import { sanitizeAuthNext } from '@/lib/auth-redirect';
import { createRouteClient } from '@/lib/supabase/server';

export async function GET() {
  // Fragments never reach the server; opening the link cannot consume its token.
  return new NextResponse(renderEmailConfirmation(), {
    headers: {...confirmationHeaders, 'Content-Type':'text/html; charset=utf-8'},
  });
}

export async function POST(request: NextRequest) {
  const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin).origin;
  // An email token signs a user in: require an explicit same-origin submission.
  if (request.headers.get('origin') !== origin) {
    return new NextResponse('Solicitud no válida.', {status:403, headers:confirmationHeaders});
  }
  let form: FormData;
  try { form = await request.formData(); }
  catch { return new NextResponse('Solicitud no válida.', {status:400, headers:confirmationHeaders}); }
  const params = new URLSearchParams();
  for (const key of ['token_hash', 'type']) {
    const value = form.get(key);
    if (typeof value === 'string') params.set(key,value);
  }
  const input = getEmailConfirmation(params);
  const fail = () => NextResponse.redirect(`${origin}/ingresar?error=enlace-invalido`, {status:303, headers:confirmationHeaders});
  if (!input) return fail();
  const nextValue = form.get('next');
  const next = sanitizeAuthNext(typeof nextValue === 'string' ? nextValue : null, '/panel');
  const response = NextResponse.redirect(`${origin}${next}`, {status:303, headers:confirmationHeaders});
  const supabase = createRouteClient(request,response);
  try {
    const result = await authenticateAuthCallback(params,supabase.auth);
    return result.ok ? response : fail();
  } catch { return fail(); }
}
