import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron/secret";
import { runRollup } from "@/lib/cron/rollup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  const result = await runRollup();
  return NextResponse.json({ ok: true, ...result });
}
