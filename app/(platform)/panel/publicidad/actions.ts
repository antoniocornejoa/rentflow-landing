"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/monitoring";
import { CANALES } from "@/lib/marketing/canales";

const zSpend = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  canal: z.enum(CANALES),
  campana: z.string().max(120).optional().or(z.literal("")),
  monto: z.coerce.number().int().nonnegative(),
  notas: z.string().max(500).optional().or(z.literal("")),
});

export type SpendState = { error?: string; ok?: boolean };

/** Registra un gasto de publicidad (nivel plataforma). Sólo admin. */
export async function addSpend(_prev: SpendState, formData: FormData): Promise<SpendState> {
  const admin = await requireAdmin();

  const parsed = zSpend.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const input = parsed.data;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("marketing_spend")
    .insert({
      fecha: input.fecha,
      canal: input.canal,
      campana: input.campana ? input.campana : null,
      monto: input.monto,
      notas: input.notas ? input.notas : null,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (error) return { error: "No se pudo guardar el gasto. Intenta de nuevo." };

  await logAudit({
    actor: admin,
    accion: "publicidad.registrada",
    entidad: "marketing_spend",
    entidadId: data?.id ?? null,
    detalle: { canal: input.canal, monto: input.monto },
  });
  revalidatePath("/publicidad");
  return { ok: true };
}

const zDelete = z.object({ id: z.string().uuid() });

/** Elimina un gasto de publicidad. Sólo admin. */
export async function deleteSpend(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const parsed = zDelete.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const supabase = createAdminClient();
  const { error } = await supabase.from("marketing_spend").delete().eq("id", parsed.data.id);
  if (error) return;

  await logAudit({
    actor: admin,
    accion: "publicidad.eliminada",
    entidad: "marketing_spend",
    entidadId: parsed.data.id,
  });
  revalidatePath("/publicidad");
}
