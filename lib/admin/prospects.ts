import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

export type Estado = Database["public"]["Enums"]["prospect_estado"];
export type ActivityTipo = Database["public"]["Enums"]["prospect_activity_tipo"];

/** Etapas cerradas: ya no requieren seguimiento. */
const CERRADOS: Estado[] = ["convertido", "descartado"];

export type SeguimientoEstado = "atrasado" | "hoy" | "proximo" | null;

export interface ProspectRow {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  empresa: string | null;
  plan_interes: string | null;
  plantilla_interes: string | null;
  mensaje: string | null;
  origen: string | null;
  estado: Estado;
  proximo_seguimiento: string | null;
  created_at: string;
  seguimiento: SeguimientoEstado;
}

export interface ProspectsOverview {
  total: number;
  nuevos: number;
  atrasados: number;
  hoy: number;
  prospects: ProspectRow[];
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Estado de seguimiento de un prospecto según su próxima fecha agendada. */
function calcSeguimiento(estado: Estado, proximo: string | null, hoy: string): SeguimientoEstado {
  if (!proximo || CERRADOS.includes(estado)) return null;
  if (proximo < hoy) return "atrasado";
  if (proximo === hoy) return "hoy";
  return "proximo";
}

const RANK: Record<Exclude<SeguimientoEstado, null> | "none", number> = {
  atrasado: 0,
  hoy: 1,
  proximo: 2,
  none: 3,
};

/** Prospectos del sitio comercial con su estado de seguimiento. Sólo admin. */
export async function getProspects(): Promise<ProspectsOverview> {
  const supabase = createAdminClient();
  const hoy = hoyISO();
  const { data } = await supabase
    .from("prospects")
    .select(
      "id, nombre, email, telefono, empresa, plan_interes, plantilla_interes, mensaje, origen, estado, proximo_seguimiento, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(300);

  const prospects: ProspectRow[] = (data ?? []).map((p) => ({
    ...p,
    plan_interes: p.plan_interes,
    plantilla_interes: p.plantilla_interes,
    seguimiento: calcSeguimiento(p.estado, p.proximo_seguimiento, hoy),
  }));

  // Los que necesitan atención (atrasado → hoy → próximo) primero.
  prospects.sort((a, b) => {
    const ra = RANK[a.seguimiento ?? "none"];
    const rb = RANK[b.seguimiento ?? "none"];
    if (ra !== rb) return ra - rb;
    if (ra < 3) return (a.proximo_seguimiento ?? "") < (b.proximo_seguimiento ?? "") ? -1 : 1;
    return a.created_at < b.created_at ? 1 : -1;
  });

  return {
    total: prospects.length,
    nuevos: prospects.filter((p) => p.estado === "nuevo").length,
    atrasados: prospects.filter((p) => p.seguimiento === "atrasado").length,
    hoy: prospects.filter((p) => p.seguimiento === "hoy").length,
    prospects,
  };
}

export interface ActivityRow {
  id: string;
  tipo: ActivityTipo;
  detalle: string | null;
  estado_nuevo: Estado | null;
  created_at: string;
}

export interface ProspectDetail {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  empresa: string | null;
  plan_interes: string | null;
  plantilla_interes: string | null;
  mensaje: string | null;
  origen: string | null;
  estado: Estado;
  proximo_seguimiento: string | null;
  convertido_tenant_id: string | null;
  created_at: string;
  actividades: ActivityRow[];
}

/** Ficha de un prospecto con su línea de tiempo de actividades. Sólo admin. */
export async function getProspectDetail(id: string): Promise<ProspectDetail | null> {
  const supabase = createAdminClient();
  const [pRes, aRes] = await Promise.all([
    supabase
      .from("prospects")
      .select(
        "id, nombre, email, telefono, empresa, plan_interes, plantilla_interes, mensaje, origen, estado, proximo_seguimiento, convertido_tenant_id, created_at",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("prospect_activities")
      .select("id, tipo, detalle, estado_nuevo, created_at")
      .eq("prospect_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!pRes.data) return null;
  return { ...pRes.data, actividades: (aRes.data ?? []) as ActivityRow[] };
}
