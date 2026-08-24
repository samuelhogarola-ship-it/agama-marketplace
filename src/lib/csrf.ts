import { NextResponse } from "next/server";

function allowedOrigin(request: Request): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl && !siteUrl.includes("localhost")) {
    return new URL(siteUrl).origin;
  }
  // Detrás de un proxy (nginx/caddy) el host real viene en x-forwarded-host
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/**
 * Rechaza peticiones que no vengan del propio sitio.
 *
 * Se comprueba `Origin` y, si falta, `Sec-Fetch-Site` — todo navegador con
 * soporte para fetch envía al menos una de las dos en una petición con método
 * no seguro. Una petición sin ninguna de las dos no procede de un navegador,
 * así que se rechaza en lugar de dejarla pasar.
 *
 * No aplicar a webhooks: esos se autentican por firma, no por origen.
 */
export function checkOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");

  if (origin) {
    return origin === allowedOrigin(request)
      ? null
      : NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }

  // Sin `Origin`: aceptamos solo si el navegador declara que es same-origin.
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "same-origin" || fetchSite === "none") return null;

  return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
}
