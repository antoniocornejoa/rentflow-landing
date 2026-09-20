import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Endpoint de salud (uptime). No toca la base de datos. */
export function GET() {
  return NextResponse.json({
    ok: true,
    service: "rentflow-plataforma",
    time: new Date().toISOString(),
  });
}
