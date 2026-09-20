import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { primerDiaMes, claveMesDe, ultimos6Meses } from "@/lib/dates";
import type { Database } from "@/lib/supabase/database.types";

type Estado = Database["public"]["Enums"]["tenant_estado"];
type Plan = Database["public"]["Enums"]["plan_tipo"];
type EstadoPago = Database["public"]["Enums"]["cuenta_estado_pago"];

export interface TenantRow {
  id: string;
  nombre_negocio: string;
  slug: string;
  plan: Plan;
  estado: Estado;
  mrr: number;
  estado_pago: EstadoPago | null;
  leadsMes: number;
}

export interface AdminOverview {
  mrr: number;
  clientesActivos: number;
  leadsMes: number;
  churnMes: number;
  leadsPorMes: { mes: string; leads: number }[];
  tenants: TenantRow[];
}

/** KPIs globales + tabla de tenants para el dashboard del operador. */
export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = createAdminClient();
  const inicioMes = primerDiaMes(0);
  const inicio6 = primerDiaMes(-5);

  const [tenantsRes, subsRes, leadsRes] = await Promise.all([
    supabase.from("tenants").select("id, nombre_negocio, slug, plan, estado").order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("tenant_id, monto, estado_pago, cancelado_at"),
    supabase.from("leads").select("tenant_id, created_at").gte("created_at", inicio6.toISOString()),
  ]);

  const tenants = tenantsRes.data ?? [];
  const subs = subsRes.data ?? [];
  const leads = leadsRes.data ?? [];

  const subByTenant = new Map(subs.map((s) => [s.tenant_id, s]));

  // MRR: suma de suscripciones no canceladas de tenants no cancelados.
  let mrr = 0;
  for (const s of subs) {
    if (!s.cancelado_at) mrr += s.monto;
  }

  const clientesActivos = tenants.filter((t) => t.estado === "activo").length;

  // Churn del mes: suscripciones canceladas en el mes actual.
  const churnMes = subs.filter((s) => s.cancelado_at && new Date(s.cancelado_at) >= inicioMes).length;

  // Leads por tenant este mes + serie de 6 meses.
  const meses = ultimos6Meses();
  const leadsMesPorTenant = new Map<string, number>();
  const serie = new Map<string, number>(meses.map((m) => [m.clave, 0]));

  let leadsMes = 0;
  for (const l of leads) {
    const clave = claveMesDe(l.created_at);
    if (serie.has(clave)) serie.set(clave, (serie.get(clave) ?? 0) + 1);
    if (new Date(l.created_at) >= inicioMes) {
      leadsMes++;
      leadsMesPorTenant.set(l.tenant_id, (leadsMesPorTenant.get(l.tenant_id) ?? 0) + 1);
    }
  }

  const leadsPorMes = meses.map((m) => ({ mes: m.etiqueta, leads: serie.get(m.clave) ?? 0 }));

  const rows: TenantRow[] = tenants.map((t) => {
    const sub = subByTenant.get(t.id);
    return {
      id: t.id,
      nombre_negocio: t.nombre_negocio,
      slug: t.slug,
      plan: t.plan,
      estado: t.estado,
      mrr: sub && !sub.cancelado_at ? sub.monto : 0,
      estado_pago: sub?.estado_pago ?? null,
      leadsMes: leadsMesPorTenant.get(t.id) ?? 0,
    };
  });

  return { mrr, clientesActivos, leadsMes, churnMes, leadsPorMes, tenants: rows };
}
