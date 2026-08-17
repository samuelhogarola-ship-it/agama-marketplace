import { NextResponse } from "next/server";

export function checkOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  let allowed: string;

  if (siteUrl && !siteUrl.includes("localhost")) {
    allowed = new URL(siteUrl).origin;
  } else {
    // Detrás de un proxy (nginx/caddy) el host real viene en x-forwarded-host
    const host =
      request.headers.get("x-forwarded-host") ??
      request.headers.get("host") ??
      "localhost:3000";
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    allowed = `${proto}://${host}`;
  }

  if (origin !== allowed) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }
  return null;
}
