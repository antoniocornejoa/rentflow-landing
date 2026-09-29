"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/monitoring";
import { ESTADOS, ACTIVIDAD_TIPOS } from "@/lib/prospects/seguimiento";

function revalidar(prospectId: string): void {
  revalidatePath(`/prospectos/${prospectId}`);
  revalidatePath("/prospectos");
}

// ── Registrar actividad (nota, llamada, whatsapp, email, reunión, propuesta) ──
const zActivity = z.object({
  prospect_id: z.string().uuid(),
  tipo: z.enum(ACTIVIDAD_TIPOS),
  detalle: z.string().max(2000).optional().or(z.literal("")),
});

export async function addActivity(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = zActivity.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { prospect_id, tipo, detalle } = parsed.data;

  const supabase = createAdminClient();
  const { error } = await supabase.from("prospect_activities").insert({
    prospect_id,
    tipo,
    detalle: detalle ? detalle : null,
    created_by: admin.id,
  });
  if (error) return;

  await supabase.from("prospects").update({ updated_at: new Date().toISOString() }).eq("id", prospect_id);
  await logAudit({ actor: admin, accion: "prospecto.actividad", entidad: "prospect", entidadId: prospect_id, detalle: { tipo } });
  revalidar(prospect_id);
}

// ── Cambiar etapa del embudo ─────────────────────────────────────────────────
const zEstado = z.object({
  prospect_id: z.string().uuid(),
  estado: z.enum(ESTADOS),
});

export async function changeEstado(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = zEstado.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { prospect_id, estado } = parsed.data;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("prospects")
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("id", prospect_id);
  if (error) return;

  // Deja la traza del cambio en la línea de tiempo.
  await supabase.from("prospect_activities").insert({
    prospect_id,
    tipo: "cambio_estado",
    estado_nuevo: estado,
    created_by: admin.id,
  });
  await logAudit({ actor: admin, accion: "prospecto.estado", entidad: "prospect", entidadId: prospect_id, detalle: { estado } });
  revalidar(prospect_id);
}

// ── Agendar (o quitar) el próximo seguimiento ────────────────────────────────
const zSeguimiento = z.object({
  prospect_id: z.string().uuid(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
});

export async function setProximoSeguimiento(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = zSeguimiento.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { prospect_id, fecha } = parsed.data;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("prospects")
    .update({ proximo_seguimiento: fecha ? fecha : null, updated_at: new Date().toISOString() })
    .eq("id", prospect_id);
  if (error) return;

  await logAudit({ actor: admin, accion: "prospecto.seguimiento", entidad: "prospect", entidadId: prospect_id, detalle: { fecha: fecha || null } });
  revalidar(prospect_id);
}
