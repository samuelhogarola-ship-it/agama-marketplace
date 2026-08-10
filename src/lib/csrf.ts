import { NextResponse } from "next/server";

export function checkOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const allowed = new URL(siteUrl).origin;
  if (origin && origin !== allowed) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }
  return null;
}
