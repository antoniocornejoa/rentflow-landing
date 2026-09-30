import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateTenant } from "@/lib/tenant/revalidate";
import { fechaISO } from "@/lib/dates";

/** Reglas de cobranza (días de atraso desde el próximo cobro). Editables. */
export const DIAS_MOROSO = 5;
export const DIAS_SUSPENDER = 15;

function diasAtraso(proximoCobro: string, hoy: string): number {
  return Math.floor((Date.parse(hoy) - Date.parse(proximoCobro)) / 86_400_000);
}

type Admin = ReturnType<typeof createAdminClient>;

async function marcar(
  supabase: Admin,
  tenantId: string,
  estado: "activo" | "moroso" | "suspendido",
  estadoPago: "al_dia" | "vencido",
): Promise<void> {
  await supabase.from("tenants").update({ estado }).eq("id", tenantId);
  await supabase.from("subscriptions").update({ estado_pago: estadoPago }).eq("tenant_id", tenantId);
  revalidateTenant(tenantId);
}

/**
 * Cobranza automática (dunning). Revisa las suscripciones con fecha de cobro
 * vencida y ajusta el estado del cliente:
 *   atraso >= DIAS_SUSPENDER -> suspendido (su página queda en mantención)
 *   atraso >= DIAS_MOROSO    -> moroso     (aviso; la página sigue arriba)
 *   al día (pagó)            -> reactiva a activo, SOLO si la baja fue por pago
 *                               (estado_pago 'vencido'); no revierte suspensiones
 *                               manuales del operador.
 * No toca clientes en onboarding ni cancelados, ni suscripciones sin fecha de
 * cobro definida (proximo_cobro null).
 */
export async function runBilling(): Promise<{
  revisadas: number;
  aMoroso: number;
  aSuspendido: number;
  reactivados: number;
}> {
  const supabase = createAdminClient();
  const hoy = fechaISO(new Date());

  const { data: subs, error } = await supabase
    .from("subscriptions")
    .select("tenant_id, proximo_cobro, estado_pago")
    .is("cancelado_at", null)
    .not("proximo_cobro", "is", null);
  if (error) throw error;

  const rows = subs ?? [];
  if (rows.length === 0) return { revisadas: 0, aMoroso: 0, aSuspendido: 0, reactivados: 0 };

  const ids = rows.map((s) => s.tenant_id);
  const { data: tenants, error: tErr } = await supabase.from("tenants").select("id, estado").in("id", ids);
  if (tErr) throw tErr;
  const estadoById = new Map((tenants ?? []).map((t) => [t.id, t.estado]));

  let aMoroso = 0;
  let aSuspendido = 0;
  let reactivados = 0;

  for (const s of rows) {
    const estado = estadoById.get(s.tenant_id);
    // Sólo gestionamos clientes ya dentro del flujo de facturación.
    if (estado !== "activo" && estado !== "moroso" && estado !== "suspendido") continue;
    const dias = diasAtraso(s.proximo_cobro as string, hoy);

    if (dias >= DIAS_SUSPENDER) {
      if (estado !== "suspendido") {
        await marcar(supabase, s.tenant_id, "suspendido", "vencido");
        aSuspendido++;
      }
    } else if (dias >= DIAS_MOROSO) {
      if (estado !== "moroso") {
        await marcar(supabase, s.tenant_id, "moroso", "vencido");
        aMoroso++;
      }
    } else if ((estado === "moroso" || estado === "suspendido") && s.estado_pago === "vencido") {
      // Volvió a estar al día (le registraron el pago / regalaron mes).
      await marcar(supabase, s.tenant_id, "activo", "al_dia");
      reactivados++;
    }
  }

  return { revisadas: rows.length, aMoroso, aSuspendido, reactivados };
}
