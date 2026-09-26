import { NextRequest, NextResponse } from 'next/server';
import { authenticateAuthCallback, getEmailConfirmation } from '@/lib/auth-callback';
import { renderEmailConfirmation } from '@/lib/auth-confirmation';
import { sanitizeAuthNext } from '@/lib/auth-redirect';
import { createRouteClient } from '@/lib/supabase/server';

const privateHeaders = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'strict-origin',
  'X-Robots-Tag': 'noindex, nofollow',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
};

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const input = getEmailConfirmation(params);
  // Mail scanners can load this page without consuming the one-time token.
  return new NextResponse(renderEmailConfirmation(input ? {...input, next:sanitizeAuthNext(params.get('next'), '/panel')} : null), {
    status: input ? 200 : 400,
    headers: {...privateHeaders, 'Content-Type':'text/html; charset=utf-8'},
  });
}

export async function POST(request: NextRequest) {
  const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin).origin;
  // An email token signs a user in: require an explicit same-origin submission.
  if (request.headers.get('origin') !== origin) {
    return new NextResponse('Solicitud no válida.', {status:403, headers:privateHeaders});
  }
  let form: FormData;
  try { form = await request.formData(); }
  catch { return new NextResponse('Solicitud no válida.', {status:400, headers:privateHeaders}); }
  const params = new URLSearchParams();
  for (const key of ['token_hash', 'type']) {
    const value = form.get(key);
    if (typeof value === 'string') params.set(key,value);
  }
  const input = getEmailConfirmation(params);
  const fail = () => NextResponse.redirect(`${origin}/ingresar?error=enlace-invalido`, {status:303, headers:privateHeaders});
  if (!input) return fail();
  const nextValue = form.get('next');
  const next = sanitizeAuthNext(typeof nextValue === 'string' ? nextValue : null, '/panel');
  const response = NextResponse.redirect(`${origin}${next}`, {status:303, headers:privateHeaders});
  const supabase = createRouteClient(request,response);
  try {
    const result = await authenticateAuthCallback(params,supabase.auth);
    return result.ok ? response : fail();
  } catch { return fail(); }
}
