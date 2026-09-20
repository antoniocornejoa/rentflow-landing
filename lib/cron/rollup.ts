import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

function topN(counts: Record<string, number>, n = 10): Record<string, number> {
  return Object.fromEntries(
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n),
  );
}

function inc(obj: Record<string, number>, key: string | null | undefined) {
  if (!key) return;
  obj[key] = (obj[key] ?? 0) + 1;
}

/**
 * Rollup diario: agrega page_views (crudo) del día anterior a page_view_daily,
 * asegura particiones futuras y purga particiones crudas de >90 días.
 */
export async function runRollup(): Promise<{ fecha: string; tenants: number }> {
  const supabase = createAdminClient();

  // Mantener particiones del mes actual y próximos.
  await supabase.rpc("page_views_ensure_partitions");

  const now = new Date();
  const inicio = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const fin = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const fecha = inicio.toISOString().slice(0, 10);

  const { data: rows } = await supabase
    .from("page_views")
    .select("tenant_id, path, referrer_host, device")
    .gte("created_at", inicio.toISOString())
    .lt("created_at", fin.toISOString());

  const per = new Map<
    string,
    { visitas: number; device: Record<string, number>; path: Record<string, number>; ref: Record<string, number> }
  >();

  for (const r of rows ?? []) {
    let agg = per.get(r.tenant_id);
    if (!agg) {
      agg = { visitas: 0, device: {}, path: {}, ref: {} };
      per.set(r.tenant_id, agg);
    }
    agg.visitas++;
    inc(agg.device, r.device);
    inc(agg.path, r.path);
    inc(agg.ref, r.referrer_host);
  }

  const upserts = Array.from(per.entries()).map(([tenant_id, agg]) => ({
    tenant_id,
    fecha,
    visitas: agg.visitas,
    por_device: agg.device as unknown as Json,
    por_path: topN(agg.path) as unknown as Json,
    por_referrer: topN(agg.ref) as unknown as Json,
  }));

  if (upserts.length) {
    await supabase.from("page_view_daily").upsert(upserts, { onConflict: "tenant_id,fecha" });
  }

  // Purga la partición cruda de hace ~4 meses (el histórico vive en el rollup).
  const viejo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 4, 1));
  await supabase.rpc("page_views_drop_partition", { p_month: viejo.toISOString().slice(0, 10) });

  return { fecha, tenants: upserts.length };
}
