import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ ok: true, service: "todoplastico", timestamp: new Date().toISOString() });
}
