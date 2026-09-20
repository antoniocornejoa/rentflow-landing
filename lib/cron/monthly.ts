import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, escapeHtml } from "@/lib/email";
import type { Json } from "@/lib/supabase/database.types";

const MESES_LARGO = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function pct(actual: number, previo: number): number {
  if (previo === 0) return actual > 0 ? 100 : 0;
  return Math.round(((actual - previo) / previo) * 100);
}

function reporteHtml(nombre: string, mesLabel: string, leads: number, visitas: number, deltaLeadsPct: number): string {
  const flecha = deltaLeadsPct >= 0 ? "▲" : "▼";
  return `<div style="font-family:sans-serif;max-width:520px;margin:auto">
    <h1 style="font-size:20px">${escapeHtml(nombre)}</h1>
    <p style="color:#475569">Tu resumen de <strong>${mesLabel}</strong>:</p>
    <div style="display:flex;gap:16px;margin:16px 0">
      <div style="flex:1;background:#f1f5f9;border-radius:12px;padding:16px">
        <div style="font-size:28px;font-weight:700;color:#0f766e">${leads}</div>
        <div style="color:#64748b;font-size:13px">contactos nuevos ${flecha} ${Math.abs(deltaLeadsPct)}%</div>
      </div>
      <div style="flex:1;background:#f1f5f9;border-radius:12px;padding:16px">
        <div style="font-size:28px;font-weight:700">${visitas}</div>
        <div style="color:#64748b;font-size:13px">visitas</div>
      </div>
    </div>
    <p style="color:#94a3b8;font-size:12px">Reporte automático de RentFlow.</p>
  </div>`;
}

/**
 * Reporte mensual (Vercel Cron día 1): por cada tenant activo agrega visitas y
 * leads del mes anterior, compara con el mes previo, guarda el histórico y envía
 * el correo con asunto "[Negocio]: X contactos nuevos en [mes]".
 */
export async function runMonthlyReports(): Promise<{ tenants: number; enviados: number }> {
  const supabase = createAdminClient();
  const now = new Date();
  const prevStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const prevEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const prev2Start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
  const periodo = prevStart.toISOString().slice(0, 10);
  const mesLabel = `${MESES_LARGO[prevStart.getUTCMonth()]} ${prevStart.getUTCFullYear()}`;

  const { data: tenants } = await supabase.from("tenants").select("id, nombre_negocio").eq("estado", "activo");
  if (!tenants || tenants.length === 0) return { tenants: 0, enviados: 0 };
  const ids = tenants.map((t) => t.id);

  // Emails de los dueños (primer propietario por tenant).
  const { data: tus } = await supabase.from("tenant_users").select("tenant_id, user_id").in("tenant_id", ids);
  const userIds = Array.from(new Set((tus ?? []).map((r) => r.user_id)));
  const { data: users } = userIds.length
    ? await supabase.from("users").select("id, email").in("id", userIds)
    : { data: [] };
  const emailByUser = new Map((users ?? []).map((u) => [u.id, u.email]));
  const ownerEmailByTenant = new Map<string, string>();
  for (const r of tus ?? []) {
    const email = emailByUser.get(r.user_id);
    if (email && !ownerEmailByTenant.has(r.tenant_id)) ownerEmailByTenant.set(r.tenant_id, email);
  }

  // Leads de los 2 meses (para comparativa).
  const { data: leads } = await supabase
    .from("leads")
    .select("tenant_id, origen, created_at")
    .in("tenant_id", ids)
    .gte("created_at", prev2Start.toISOString())
    .lt("created_at", prevEnd.toISOString());

  // Visitas de los 2 meses (rollup).
  const { data: daily } = await supabase
    .from("page_view_daily")
    .select("tenant_id, fecha, visitas, por_path")
    .in("tenant_id", ids)
    .gte("fecha", prev2Start.toISOString().slice(0, 10))
    .lt("fecha", prevEnd.toISOString().slice(0, 10));

  const enPrev = (iso: string) => new Date(iso) >= prevStart && new Date(iso) < prevEnd;

  let enviados = 0;
  for (const t of tenants) {
    const tLeads = (leads ?? []).filter((l) => l.tenant_id === t.id);
    const leadsPrev = tLeads.filter((l) => enPrev(l.created_at));
    const leadsPrev2 = tLeads.filter((l) => !enPrev(l.created_at));
    const porOrigen: Record<string, number> = {};
    for (const l of leadsPrev) porOrigen[l.origen] = (porOrigen[l.origen] ?? 0) + 1;

    const tDaily = (daily ?? []).filter((d) => d.tenant_id === t.id);
    const visitasPrev = tDaily.filter((d) => enPrev(d.fecha)).reduce((s, d) => s + d.visitas, 0);
    const visitasPrev2 = tDaily.filter((d) => !enPrev(d.fecha)).reduce((s, d) => s + d.visitas, 0);

    const topPaths: Record<string, number> = {};
    for (const d of tDaily.filter((x) => enPrev(x.fecha))) {
      const p = (d.por_path ?? {}) as Record<string, number>;
      for (const [path, n] of Object.entries(p)) topPaths[path] = (topPaths[path] ?? 0) + (typeof n === "number" ? n : 0);
    }

    const comparativa = {
      visitas_prev: visitasPrev2,
      leads_prev: leadsPrev2.length,
      visitas_delta_pct: pct(visitasPrev, visitasPrev2),
      leads_delta_pct: pct(leadsPrev.length, leadsPrev2.length),
    };

    let emailMessageId: string | null = null;
    let emailEnviado = false;
    const to = ownerEmailByTenant.get(t.id);
    if (to) {
      const res = await sendEmail({
        to,
        subject: `${t.nombre_negocio}: ${leadsPrev.length} contactos nuevos en ${mesLabel}`,
        html: reporteHtml(t.nombre_negocio, mesLabel, leadsPrev.length, visitasPrev, comparativa.leads_delta_pct),
      });
      emailEnviado = res.sent;
      emailMessageId = res.id ?? null;
      if (res.sent) enviados++;
    }

    await supabase.from("monthly_reports").upsert(
      {
        tenant_id: t.id,
        periodo,
        visitas: visitasPrev,
        leads_total: leadsPrev.length,
        leads_por_origen: porOrigen as unknown as Json,
        top_paths: topPaths as unknown as Json,
        comparativa: comparativa as unknown as Json,
        email_enviado: emailEnviado,
        email_message_id: emailMessageId,
      },
      { onConflict: "tenant_id,periodo" },
    );
  }

  return { tenants: tenants.length, enviados };
}
