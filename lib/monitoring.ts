import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppUser } from "@/lib/auth";
import type { Json } from "@/lib/supabase/database.types";

/**
 * Registro de monitoreo y logs. Todas las funciones son "a prueba de fallos":
 * si el registro falla, NUNCA rompe la acción real del usuario (se traga su
 * propio error). La escritura usa el cliente service_role (bypassa RLS).
 */

type Actor = Pick<AppUser, "id" | "email" | "rol"> | null | undefined;

interface AuditEntry {
  actor?: Actor;
  accion: string;
  entidad?: string | null;
  entidadId?: string | null;
  tenantId?: string | null;
  detalle?: Record<string, unknown>;
}

/** Registra una acción en el log de auditoría (quién hizo qué y cuándo). */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("audit_log").insert({
      actor_id: entry.actor?.id ?? null,
      actor_email: entry.actor?.email ?? null,
      actor_rol: entry.actor?.rol ?? null,
      accion: entry.accion,
      entidad: entry.entidad ?? null,
      entidad_id: entry.entidadId ?? null,
      tenant_id: entry.tenantId ?? null,
      detalle: (entry.detalle ?? {}) as unknown as Json,
    });
  } catch {
    // El registro nunca debe interrumpir la acción real.
  }
}

interface ErrorEntry {
  nivel?: "error" | "warn" | "info";
  origen: string;
  mensaje: string;
  detalle?: Record<string, unknown>;
  tenantId?: string | null;
}

/** Registra un error/aviso de la aplicación. */
export async function logError(e: ErrorEntry): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("error_events").insert({
      nivel: e.nivel ?? "error",
      origen: e.origen,
      mensaje: e.mensaje,
      detalle: (e.detalle ?? {}) as unknown as Json,
      tenant_id: e.tenantId ?? null,
    });
  } catch {
    // idem
  }
}

/**
 * Ejecuta una tarea (cron) y registra su corrida en `job_runs`: duración,
 * estado y detalle en éxito, o el error si falla (relanza para que el llamador
 * decida el código de respuesta). El registro en sí nunca hace fallar la tarea.
 */
export async function recordJob<T extends Record<string, unknown>>(
  job: string,
  fn: () => Promise<T>,
): Promise<T> {
  const started = Date.now();
  const startedAtIso = new Date(started).toISOString();
  const supabase = createAdminClient();

  // Fase 1: deja una fila 'running' al iniciar. Así, si Vercel mata el proceso
  // por timeout/OOM (no corre ni el éxito ni el catch), la corrida NO queda
  // invisible: persiste como 'running' y se puede detectar como fallo probable.
  let runId: string | null = null;
  try {
    const { data } = await supabase
      .from("job_runs")
      .insert({ job, estado: "running", started_at: startedAtIso })
      .select("id")
      .single();
    runId = data?.id ?? null;
  } catch {
    // Si no se pudo registrar el inicio, seguimos igual (se intentará al final).
  }

  async function cerrar(fields: { estado: "success" | "error"; detalle?: Json; error?: string }): Promise<void> {
    const row = { ...fields, finished_at: new Date().toISOString(), duration_ms: Date.now() - started };
    try {
      if (runId) await supabase.from("job_runs").update(row).eq("id", runId);
      else await supabase.from("job_runs").insert({ job, started_at: startedAtIso, ...row });
    } catch {
      // El registro nunca debe afectar el resultado de la tarea.
    }
  }

  try {
    const result = await fn();
    await cerrar({ estado: "success", detalle: result as unknown as Json });
    return result;
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err);
    await cerrar({ estado: "error", error: mensaje });
    await logError({ origen: `job:${job}`, mensaje });
    throw err;
  }
}
