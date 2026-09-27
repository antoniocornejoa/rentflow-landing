import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron/secret";
import { runMonthlyReports } from "@/lib/cron/monthly";
import { recordJob } from "@/lib/monitoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  try {
    const result = await recordJob("cron.monthly", () => runMonthlyReports());
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
