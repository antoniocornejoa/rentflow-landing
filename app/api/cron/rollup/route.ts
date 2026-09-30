import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron/secret";
import { runRollup } from "@/lib/cron/rollup";
import { runSeguimientos } from "@/lib/cron/seguimientos";
import { runBilling } from "@/lib/billing";
import { recordJob } from "@/lib/monitoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  try {
    const result = await recordJob("cron.rollup", () => runRollup());
    // Aviso diario de seguimientos pendientes (se corre junto al rollup para no
    // depender de otro cron). Best-effort: nunca hace fallar el rollup.
    let seguimientos: unknown = null;
    try {
      seguimientos = await recordJob("cron.seguimientos", () => runSeguimientos());
    } catch (e) {
      seguimientos = { error: e instanceof Error ? e.message : "error" };
    }
    // Cobranza automática (dunning): marca moroso/suspende según vencimiento.
    let billing: unknown = null;
    try {
      billing = await recordJob("cron.billing", () => runBilling());
    } catch (e) {
      billing = { error: e instanceof Error ? e.message : "error" };
    }
    return NextResponse.json({ ok: true, ...result, seguimientos, billing });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
