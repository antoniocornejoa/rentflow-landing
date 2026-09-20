import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { primerDiaMes, claveMesDe, ultimos6Meses } from "@/lib/dates";
import { parseTenantContent, type TenantContent } from "@/lib/content/schema";
import type { Database } from "@/lib/supabase/database.types";

export interface PortalLead {
  id: string;
  nombre: string | null;
  telefono: string | null;
  email: string | null;
  origen: Database["public"]["Enums"]["lead_origen"];
  estado: Database["public"]["Enums"]["lead_estado"];
  created_at: string;
  atendido_at: string | null;
}

export interface PortalData {
  tenant: {
    id: string;
    nombre_negocio: string;
    estado: Database["public"]["Enums"]["tenant_estado"];
    plantilla: Database["public"]["Enums"]["plantilla_tipo"];
    hostname: string | null;
  } | null;
  leadsMes: PortalLead[];
  serie: { mes: string; leads: number; visitas: number }[];
  content: TenantContent | null;
}

/** Devuelve los tenant_id de un usuario (para verificación de acceso). */
export async function userTenantIds(userId: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("tenant_users").select("tenant_id").eq("user_id", userId);
  return (data ?? []).map((r) => r.tenant_id);
}

/** Datos del portal para el primer tenant del usuario. */
export async function getPortalData(userId: string): Promise<PortalData> {
  const supabase = createAdminClient();
  const ids = await userTenantIds(userId);
  const tenantId = ids[0];
  if (!tenantId) return { tenant: null, leadsMes: [], serie: [], content: null };

  const inicio6 = primerDiaMes(-5);
  const inicio6Date = inicio6.toISOString().slice(0, 10);
  const inicioMes = primerDiaMes(0);

  const [tenantRes, domainsRes, leadsRes, dailyRes, contentRes] = await Promise.all([
    supabase.from("tenants").select("id, nombre_negocio, estado, plantilla").eq("id", tenantId).maybeSingle(),
    supabase.from("tenant_domains").select("hostname, is_primary").eq("tenant_id", tenantId),
    supabase
      .from("leads")
      .select("id, nombre, telefono, email, origen, estado, created_at, atendido_at")
      .eq("tenant_id", tenantId)
      .gte("created_at", inicio6.toISOString())
      .order("created_at", { ascending: false }),
    supabase.from("page_view_daily").select("fecha, visitas").eq("tenant_id", tenantId).gte("fecha", inicio6Date),
    supabase.from("tenant_content").select("content_published").eq("tenant_id", tenantId).maybeSingle(),
  ]);

  const tenantRow = tenantRes.data;
  if (!tenantRow) return { tenant: null, leadsMes: [], serie: [], content: null };

  const primary = domainsRes.data?.find((d) => d.is_primary) ?? domainsRes.data?.[0];
  const leads = (leadsRes.data ?? []) as PortalLead[];

  const meses = ultimos6Meses();
  const leadsSerie = new Map<string, number>(meses.map((m) => [m.clave, 0]));
  const visitasSerie = new Map<string, number>(meses.map((m) => [m.clave, 0]));
  for (const l of leads) {
    const k = claveMesDe(l.created_at);
    if (leadsSerie.has(k)) leadsSerie.set(k, (leadsSerie.get(k) ?? 0) + 1);
  }
  for (const d of dailyRes.data ?? []) {
    const k = claveMesDe(d.fecha);
    if (visitasSerie.has(k)) visitasSerie.set(k, (visitasSerie.get(k) ?? 0) + d.visitas);
  }

  const serie = meses.map((m) => ({
    mes: m.etiqueta,
    leads: leadsSerie.get(m.clave) ?? 0,
    visitas: visitasSerie.get(m.clave) ?? 0,
  }));

  const leadsMes = leads.filter((l) => new Date(l.created_at) >= inicioMes);

  let content: TenantContent | null = null;
  if (contentRes.data?.content_published) {
    const parsed = parseTenantContent(contentRes.data.content_published);
    if (parsed.ok) content = parsed.content;
  }

  return {
    tenant: {
      id: tenantRow.id,
      nombre_negocio: tenantRow.nombre_negocio,
      estado: tenantRow.estado,
      plantilla: tenantRow.plantilla,
      hostname: primary?.hostname ?? null,
    },
    leadsMes,
    serie,
    content,
  };
}
