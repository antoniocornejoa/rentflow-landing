import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type Estado = Database["public"]["Enums"]["prospect_estado"];

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
  created_at: string;
}

export interface ProspectsOverview {
  total: number;
  nuevos: number;
  prospects: ProspectRow[];
}

/** Prospectos del sitio comercial (interesados en contratar). Sólo admin. */
export async function getProspects(): Promise<ProspectsOverview> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("prospects")
    .select("id, nombre, email, telefono, empresa, plan_interes, plantilla_interes, mensaje, origen, estado, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const prospects = (data ?? []) as ProspectRow[];
  return {
    total: prospects.length,
    nuevos: prospects.filter((p) => p.estado === "nuevo").length,
    prospects,
  };
}
