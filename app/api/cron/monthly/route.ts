import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron/secret";
import { runMonthlyReports } from "@/lib/cron/monthly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  const result = await runMonthlyReports();
  return NextResponse.json({ ok: true, ...result });
}
