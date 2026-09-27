import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface JobRunRow {
  id: string;
  job: string;
  estado: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  error: string | null;
}

export interface AuditRow {
  id: string;
  actor_email: string | null;
  actor_rol: string | null;
  accion: string;
  entidad: string | null;
  tenant_id: string | null;
  tenant_nombre: string | null;
  created_at: string;
}

export interface ErrorRow {
  id: string;
  nivel: string;
  origen: string;
  mensaje: string;
  tenant_id: string | null;
  created_at: string;
}

export interface Alerta {
  tipo: string;
  severidad: "alta" | "media" | "baja";
  titulo: string;
  detalle: string;
}

export interface MonitoringOverview {
  salud: {
    dbOk: boolean;
    degradado: boolean;
    ultimoRollup: JobRunRow | null;
    ultimoMonthly: JobRunRow | null;
    erroresUlt24h: number;
    jobsFallidos7d: number;
  };
  jobs: JobRunRow[];
  auditoria: AuditRow[];
  errores: ErrorRow[];
  alertas: Alerta[];
}

const JOB_COLS = "id, job, estado, started_at, finished_at, duration_ms, error";

/** Datos del módulo de Monitoreo y logs (sólo admin; usa service_role). */
export async function getMonitoringOverview(): Promise<MonitoringOverview> {
  const supabase = createAdminClient();
  const ahora = Date.now();
  const hace24h = new Date(ahora - 24 * 3600_000).toISOString();
  const hace7d = new Date(ahora - 7 * 24 * 3600_000).toISOString();
  const hace30d = new Date(ahora - 30 * 24 * 3600_000).toISOString();

  const [jobsRes, rollupRes, monthlyRes, err24Res, jobsFail7Res, auditRes, erroresRes, tenantsRes, subsRes, leads30Res] =
    await Promise.all([
      supabase.from("job_runs").select(JOB_COLS).order("started_at", { ascending: false }).limit(20),
      supabase.from("job_runs").select(JOB_COLS).eq("job", "cron.rollup").order("started_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("job_runs").select(JOB_COLS).eq("job", "cron.monthly").order("started_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("error_events").select("*", { count: "exact", head: true }).gte("created_at", hace24h),
      supabase.from("job_runs").select("*", { count: "exact", head: true }).eq("estado", "error").gte("started_at", hace7d),
      supabase.from("audit_log").select("id, actor_email, actor_rol, accion, entidad, tenant_id, created_at").order("created_at", { ascending: false }).limit(30),
      supabase.from("error_events").select("id, nivel, origen, mensaje, tenant_id, created_at").order("created_at", { ascending: false }).limit(20),
      supabase.from("tenants").select("id, nombre_negocio, estado, created_at"),
      supabase.from("subscriptions").select("tenant_id, estado_pago, cancelado_at"),
      supabase.from("leads").select("tenant_id, created_at").gte("created_at", hace30d),
    ]);

  const dbOk = !jobsRes.error && !tenantsRes.error;
  const degradado = [
    jobsRes,
    rollupRes,
    monthlyRes,
    err24Res,
    jobsFail7Res,
    auditRes,
    erroresRes,
    tenantsRes,
    subsRes,
    leads30Res,
  ].some((r) => r.error);
  const jobs = (jobsRes.data ?? []) as JobRunRow[];
  const tenants = tenantsRes.data ?? [];
  const tenantNombre = new Map(tenants.map((t) => [t.id, t.nombre_negocio]));

  const auditoria: AuditRow[] = (auditRes.data ?? []).map((a) => ({
    id: a.id,
    actor_email: a.actor_email,
    actor_rol: a.actor_rol,
    accion: a.accion,
    entidad: a.entidad,
    tenant_id: a.tenant_id,
    tenant_nombre: a.tenant_id ? tenantNombre.get(a.tenant_id) ?? null : null,
    created_at: a.created_at,
  }));

  const errores = (erroresRes.data ?? []) as ErrorRow[];

  // ── Alertas de negocio (derivadas de datos existentes) ──
  const subs = subsRes.data ?? [];
  const morosos = tenants.filter((t) => t.estado === "moroso");
  const suspendidos = tenants.filter((t) => t.estado === "suspendido");
  const pagos = subs.filter((s) => !s.cancelado_at && (s.estado_pago === "pendiente" || s.estado_pago === "vencido"));
  const onboardingViejo = tenants.filter(
    (t) => t.estado === "onboarding" && new Date(t.created_at).getTime() < ahora - 7 * 24 * 3600_000,
  );
  const conLead = new Set((leads30Res.data ?? []).map((l) => l.tenant_id));
  const activosSinLeads = tenants.filter((t) => t.estado === "activo" && !conLead.has(t.id));

  const alertas: Alerta[] = [];
  if (suspendidos.length)
    alertas.push({ tipo: "suspendidos", severidad: "alta", titulo: `${suspendidos.length} cliente(s) suspendido(s)`, detalle: suspendidos.map((t) => t.nombre_negocio).join(", ") });
  if (morosos.length)
    alertas.push({ tipo: "morosos", severidad: "alta", titulo: `${morosos.length} cliente(s) moroso(s)`, detalle: morosos.map((t) => t.nombre_negocio).join(", ") });
  if (pagos.length)
    alertas.push({ tipo: "pagos", severidad: "media", titulo: `${pagos.length} suscripción(es) con pago pendiente o vencido`, detalle: "Revisa los cobros atrasados." });
  if (onboardingViejo.length)
    alertas.push({ tipo: "onboarding", severidad: "media", titulo: `${onboardingViejo.length} en onboarding hace +7 días`, detalle: onboardingViejo.map((t) => t.nombre_negocio).join(", ") });
  if (activosSinLeads.length)
    alertas.push({ tipo: "sin_leads", severidad: "baja", titulo: `${activosSinLeads.length} activo(s) sin contactos en 30 días`, detalle: activosSinLeads.map((t) => t.nombre_negocio).join(", ") });

  return {
    salud: {
      dbOk,
      degradado,
      ultimoRollup: (rollupRes.data ?? null) as JobRunRow | null,
      ultimoMonthly: (monthlyRes.data ?? null) as JobRunRow | null,
      erroresUlt24h: err24Res.count ?? 0,
      jobsFallidos7d: jobsFail7Res.count ?? 0,
    },
    jobs,
    auditoria,
    errores,
    alertas,
  };
}
