import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ultimos6Meses } from "@/lib/dates";

export interface SpendRow {
  id: string;
  fecha: string;
  canal: string;
  campana: string | null;
  monto: number;
  notas: string | null;
  created_at: string;
}

export interface MarketingOverview {
  totalMes: number;
  totalHistorico: number;
  prospectosMes: number;
  /** Gasto del mes ÷ prospectos del mes (CAC aproximado, mezcla orgánico + pauta). */
  costoPorProspecto: number | null;
  porCanal: { canal: string; monto: number }[];
  /** Serie de gasto de los últimos 6 meses (para el gráfico de tendencia). */
  porMes: { mes: string; monto: number }[];
  entries: SpendRow[];
}

function inicioMesUTC(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

/** Gasto en publicidad de la plataforma + métricas. Sólo admin (service_role). */
export async function getMarketingOverview(): Promise<MarketingOverview> {
  const supabase = createAdminClient();
  const inicio = inicioMesUTC();
  const inicioDate = inicio.toISOString().slice(0, 10);

  const [spendRes, prospRes] = await Promise.all([
    supabase
      .from("marketing_spend")
      .select("id, fecha, canal, campana, monto, notas, created_at")
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("prospects")
      .select("*", { count: "exact", head: true })
      .gte("created_at", inicio.toISOString()),
  ]);

  const entries = (spendRes.data ?? []) as SpendRow[];
  const prospectosMes = prospRes.count ?? 0;

  let totalHistorico = 0;
  let totalMes = 0;
  const canal = new Map<string, number>();
  for (const e of entries) {
    totalHistorico += e.monto;
    if (e.fecha >= inicioDate) {
      totalMes += e.monto;
      canal.set(e.canal, (canal.get(e.canal) ?? 0) + e.monto);
    }
  }

  const porCanal = [...canal.entries()]
    .map(([c, monto]) => ({ canal: c, monto }))
    .sort((a, b) => b.monto - a.monto);

  // Serie mensual (últimos 6 meses), rellenando con 0 los meses sin gasto.
  const meses = ultimos6Meses();
  const serie = new Map(meses.map((m) => [m.clave, 0]));
  for (const e of entries) {
    const k = e.fecha.slice(0, 7);
    if (serie.has(k)) serie.set(k, (serie.get(k) ?? 0) + e.monto);
  }
  const porMes = meses.map((m) => ({ mes: m.etiqueta, monto: serie.get(m.clave) ?? 0 }));

  return {
    totalMes,
    totalHistorico,
    prospectosMes,
    costoPorProspecto: prospectosMes > 0 ? Math.round(totalMes / prospectosMes) : null,
    porCanal,
    porMes,
    entries,
  };
}
