"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { userTenantIds } from "@/lib/portal/data";
import { revalidateTenant } from "@/lib/tenant/revalidate";
import { parseTenantContent, schemaPorPlantilla } from "@/lib/content/schema";
import { sendEmail, escapeHtml } from "@/lib/email";
import type { Json } from "@/lib/supabase/database.types";

async function assertMember(userId: string, tenantId: string): Promise<boolean> {
  const ids = await userTenantIds(userId);
  return ids.includes(tenantId);
}

/** Marca un lead como atendido (solo si pertenece a un tenant del usuario). */
export async function markLeadAttended(leadId: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const supabase = createAdminClient();
  const { data: lead } = await supabase.from("leads").select("tenant_id").eq("id", leadId).maybeSingle();
  if (!lead || !(await assertMember(user.id, lead.tenant_id))) return { ok: false };

  await supabase
    .from("leads")
    .update({ estado: "atendido", atendido_at: new Date().toISOString(), atendido_por: user.id })
    .eq("id", leadId);
  return { ok: true };
}

const zBasics = z.object({
  tenant_id: z.string().uuid(),
  hero_titulo: z.string().max(90).optional(),
  hero_subtitulo: z.string().max(160).optional(),
  whatsapp_numero: z.string().max(40).optional(),
  whatsapp_mensaje: z.string().max(300).optional(),
});

/** Edición de datos básicos por el cliente (allowlist + validación Zod). */
export async function savePortalBasics(_prev: { ok?: boolean; error?: string }, formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  const parsed = zBasics.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Datos inválidos" };
  const { tenant_id, ...campos } = parsed.data;

  if (!(await assertMember(user.id, tenant_id))) return { error: "Sin acceso" };

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("tenant_content")
    .select("content_published")
    .eq("tenant_id", tenant_id)
    .maybeSingle();
  const current = row?.content_published ? parseTenantContent(row.content_published) : null;
  if (!current || !current.ok) return { error: "El contenido actual no es válido; contáctanos." };

  // Overlay de campos permitidos.
  const next = JSON.parse(JSON.stringify(current.content)) as typeof current.content;
  if (campos.hero_titulo) next.hero.titulo = campos.hero_titulo;
  if (campos.hero_subtitulo !== undefined) next.hero.subtitulo = campos.hero_subtitulo || undefined;
  if (campos.whatsapp_numero) next.whatsapp.numero = campos.whatsapp_numero;
  if (campos.whatsapp_mensaje) next.whatsapp.mensaje_prellenado = campos.whatsapp_mensaje;

  const valid = schemaPorPlantilla(next.plantilla).safeParse(next);
  if (!valid.success) {
    const issue = valid.error.issues[0];
    return { error: `Revisa: ${issue?.message ?? "campo inválido"} (¿teléfono +56XXXXXXXXX?)` };
  }

  const { error } = await supabase
    .from("tenant_content")
    .update({ content_published: valid.data as unknown as Json, published_at: new Date().toISOString() })
    .eq("tenant_id", tenant_id);
  if (error) return { error: "No se pudo guardar" };

  revalidateTenant(tenant_id);
  return { ok: true };
}

const zCambio = z.object({
  tenant_id: z.string().uuid(),
  titulo: z.string().min(3).max(120),
  descripcion: z.string().min(5).max(2000),
  tipo: z.enum(["contenido", "diseno", "funcionalidad", "otro"]).default("contenido"),
});

/** Solicitud de "cambios mayores" del portal: se guarda y avisa al operador. */
export async function createChangeRequest(_prev: { ok?: boolean; error?: string }, formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  const parsed = zCambio.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Completa título y descripción" };
  const { tenant_id, titulo, descripcion, tipo } = parsed.data;

  if (!(await assertMember(user.id, tenant_id))) return { error: "Sin acceso" };

  const supabase = createAdminClient();
  const { error } = await supabase.from("change_requests").insert({
    tenant_id,
    solicitado_por: user.id,
    tipo,
    titulo,
    descripcion,
  });
  if (error) return { error: "No se pudo enviar la solicitud" };

  const ops = process.env.OPERADOR_EMAIL;
  if (ops) {
    void sendEmail({
      to: ops,
      replyTo: user.email,
      subject: `Solicitud de cambio: ${titulo}`,
      html: `<div style="font-family:sans-serif"><h2>${escapeHtml(titulo)}</h2><p><strong>Tipo:</strong> ${tipo}</p><p><strong>De:</strong> ${escapeHtml(user.email)}</p><p>${escapeHtml(descripcion)}</p></div>`,
    });
  }
  return { ok: true };
}
