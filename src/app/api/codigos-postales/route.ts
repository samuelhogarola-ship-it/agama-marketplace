import { NextResponse } from 'next/server';
import { lookupPostalCode } from '@/lib/postal-catalog';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('cp') ?? '';
  if (!/^[0-9]{5}$/.test(code)) return NextResponse.json({ error: 'Introduce 5 cifras.' }, { status: 400 });
  try {
    const zones = await lookupPostalCode(code);
    return NextResponse.json({ zones: zones ?? [] }, { headers: { 'Cache-Control': 'public, max-age=86400' } });
  } catch {
    return NextResponse.json({ error: 'La consulta no está disponible. Puedes completar la dirección manualmente.' }, { status: 503 });
  }
}
