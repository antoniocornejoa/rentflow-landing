"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/monitoring";
import { ROOT_DOMAIN } from "@/lib/env";
import { sumarMeses, fechaISO } from "@/lib/dates";
import { revalidateTenant, revalidateTenantHost } from "@/lib/tenant/revalidate";
import { schemaPorPlantilla, type Plantilla } from "@/lib/content/schema";
import type { Json } from "@/lib/supabase/database.types";

const zAlta = z.object({
  nombre_negocio: z.string().min(2).max(120),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])$/, "Slug inválido (minúsculas, números y guiones)"),
  plantilla: z.enum(["servicios", "gastronomia", "inmobiliaria", "retail"]),
  plan: z.enum(["basico", "pro", "premium"]),
  monto: z.coerce.number().int().nonnegative(),
  dia_cobro: z.coerce.number().int().min(1).max(28),
  owner_email: z.string().email(),
  primer_mes: z.enum(["gratis", "cobra"]).default("gratis"),
});

export type AltaState = { error?: string };

/** Alta de cliente: tenant + contenido/tema semilla + suscripción + dominio + dueño. */
export async function createTenant(_prev: AltaState, formData: FormData): Promise<AltaState> {
  const admin = await requireAdmin();

  const parsed = zAlta.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const input = parsed.data;
  const supabase = createAdminClient();

  // Semilla de contenido/tema por plantilla.
  const { data: defaults } = await supabase
    .from("plantilla_defaults")
    .select("content, theme")
    .eq("plantilla", input.plantilla)
    .maybeSingle();
  if (!defaults) return { error: "No hay contenido semilla para esa plantilla" };

  // 1) Tenant
  const { data: tenant, error: tErr } = await supabase
    .from("tenants")
    .insert({
      nombre_negocio: input.nombre_negocio,
      slug: input.slug,
      plan: input.plan,
      plantilla: input.plantilla,
      estado: "onboarding",
    })
    .select("id")
    .single();
  if (tErr || !tenant) return { error: tErr?.message ?? "No se pudo crear el tenant (¿slug duplicado?)" };

  const tenantId = tenant.id;

  // 2) Contenido + tema semilla
  const theme = (defaults.theme ?? {}) as { colores?: Json; tipografia?: Json };
  const [{ error: cErr }, { error: thErr }] = await Promise.all([
    supabase.from("tenant_content").insert({
      tenant_id: tenantId,
      plantilla: input.plantilla,
      content_published: defaults.content,
    }),
    supabase.from("tenant_theme").insert({
      tenant_id: tenantId,
      colores: theme.colores ?? {},
      tipografia: theme.tipografia ?? {},
    }),
  ]);
  if (cErr || thErr) return { error: "No se pudo inicializar el contenido del tenant" };

  // 3) Suscripción. "primer mes gratis" = primer cobro en 1 mes; "cobra" = ahora.
  const hoyDate = new Date();
  const primerCobro = input.primer_mes === "gratis" ? sumarMeses(hoyDate, 1) : hoyDate;
  await supabase.from("subscriptions").insert({
    tenant_id: tenantId,
    plan: input.plan,
    monto: input.monto,
    dia_cobro: input.dia_cobro,
    inicio: fechaISO(hoyDate),
    proximo_cobro: fechaISO(primerCobro),
  });

  // 4) Dominio propio (subdominio bajo el wildcard, ya servible = verificado)
  const hostname = `${input.slug}.${ROOT_DOMAIN}`.toLowerCase();
  await supabase.from("tenant_domains").insert({
    tenant_id: tenantId,
    hostname,
    is_primary: true,
    verificado: true,
  });
  // Refresca la resolución host->tenant por si el host quedó en 404 cacheado.
  revalidateTenantHost(hostname);

  // 5) Dueño: crea (o reutiliza) el usuario y lo asocia al tenant.
  let ownerId: string | null = null;
  const created = await supabase.auth.admin.createUser({ email: input.owner_email, email_confirm: true });
  if (created.data.user) {
    ownerId = created.data.user.id;
  } else {
    const { data: existing } = await supabase.from("users").select("id").eq("email", input.owner_email).maybeSingle();
    ownerId = existing?.id ?? null;
  }
  if (ownerId) {
    await supabase.from("tenant_users").insert({ tenant_id: tenantId, user_id: ownerId, rol: "propietario" });
  }

  await logAudit({
    actor: admin,
    accion: "tenant.creado",
    entidad: "tenant",
    entidadId: tenantId,
    tenantId,
    detalle: { nombre_negocio: input.nombre_negocio, slug: input.slug, plan: input.plan, plantilla: input.plantilla },
  });

  redirect(`/tenants/${tenantId}`);
}

/** Cambia el estado del tenant (activar / suspender / etc.) e invalida su cache. */
export async function setTenantEstado(tenantId: string, estado: string): Promise<void> {
  const admin = await requireAdmin();
  const parsed = z
    .enum(["onboarding", "activo", "suspendido", "moroso", "cancelado"])
    .safeParse(estado);
  if (!parsed.success) return;
  const supabase = createAdminClient();
  await supabase.from("tenants").update({ estado: parsed.data }).eq("id", tenantId);
  await logAudit({
    actor: admin,
    accion: "tenant.estado",
    entidad: "tenant",
    entidadId: tenantId,
    tenantId,
    detalle: { estado: parsed.data },
  });
  revalidateTenant(tenantId);
}

/** Guarda y publica el contenido de un tenant (validado con Zod). */
export async function saveContent(tenantId: string, plantilla: Plantilla, rawJson: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawJson);
  } catch {
    return { ok: false, error: "El JSON no es válido" };
  }

  const result = schemaPorPlantilla(plantilla).safeParse(parsedJson);
  if (!result.success) {
    const issue = result.error.issues[0];
    return { ok: false, error: `Contenido inválido: ${issue?.path.join(".")} — ${issue?.message}` };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("tenant_content")
    .update({ content_published: result.data as unknown as Json, published_at: new Date().toISOString() })
    .eq("tenant_id", tenantId);
  if (error) return { ok: false, error: "No se pudo guardar" };

  await logAudit({
    actor: admin,
    accion: "contenido.publicado",
    entidad: "tenant_content",
    tenantId,
    detalle: { plantilla },
  });
  revalidateTenant(tenantId);
  return { ok: true };
}

// ── Facturación ──────────────────────────────────────────────────────────────

/** Reactiva al cliente si estaba moroso/suspendido (tras pagar o regalar mes). */
async function reactivarSiCorresponde(
  supabase: ReturnType<typeof createAdminClient>,
  tenantId: string,
): Promise<void> {
  const { data: t } = await supabase.from("tenants").select("estado").eq("id", tenantId).maybeSingle();
  if (t && (t.estado === "moroso" || t.estado === "suspendido")) {
    await supabase.from("tenants").update({ estado: "activo" }).eq("id", tenantId);
    revalidateTenant(tenantId);
  }
}

/** Registra un pago del cliente: avanza el próximo cobro un mes y lo deja al día. */
export async function registrarPago(tenantId: string): Promise<void> {
  const admin = await requireAdmin();
  const supabase = createAdminClient();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, monto, moneda, proximo_cobro")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!sub) return;

  const hoy = new Date();
  const base = sub.proximo_cobro ? new Date(`${sub.proximo_cobro}T00:00:00Z`) : hoy;
  const periodo = sub.proximo_cobro ?? fechaISO(hoy);

  await supabase.from("payments").insert({
    tenant_id: tenantId,
    subscription_id: sub.id,
    periodo,
    monto: sub.monto,
    moneda: sub.moneda ?? "CLP",
    estado: "pagado",
    metodo: "manual",
    pagado_at: hoy.toISOString(),
  });
  await supabase
    .from("subscriptions")
    .update({ proximo_cobro: fechaISO(sumarMeses(base, 1)), ultimo_pago: fechaISO(hoy), estado_pago: "al_dia" })
    .eq("id", sub.id);

  await reactivarSiCorresponde(supabase, tenantId);
  await logAudit({ actor: admin, accion: "pago.registrado", entidad: "subscription", entidadId: sub.id, tenantId, detalle: { monto: sub.monto, periodo } });
  revalidatePath(`/tenants/${tenantId}`);
}

/** Regala un mes: corre el próximo cobro un mes sin registrar pago (mes gratis). */
export async function regalarMes(tenantId: string): Promise<void> {
  const admin = await requireAdmin();
  const supabase = createAdminClient();

  const { data: sub } = await supabase.from("subscriptions").select("id, proximo_cobro").eq("tenant_id", tenantId).maybeSingle();
  if (!sub) return;

  const base = sub.proximo_cobro ? new Date(`${sub.proximo_cobro}T00:00:00Z`) : new Date();
  await supabase
    .from("subscriptions")
    .update({ proximo_cobro: fechaISO(sumarMeses(base, 1)), estado_pago: "al_dia" })
    .eq("id", sub.id);

  await reactivarSiCorresponde(supabase, tenantId);
  await logAudit({ actor: admin, accion: "pago.regalado", entidad: "subscription", entidadId: sub.id, tenantId });
  revalidatePath(`/tenants/${tenantId}`);
}

const zProximoCobro = z.object({
  tenant_id: z.string().uuid(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** Ajusta manualmente la fecha del próximo cobro. */
export async function setProximoCobro(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = zProximoCobro.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const supabase = createAdminClient();
  await supabase.from("subscriptions").update({ proximo_cobro: parsed.data.fecha }).eq("tenant_id", parsed.data.tenant_id);
  await logAudit({ actor: admin, accion: "pago.fecha", entidad: "subscription", tenantId: parsed.data.tenant_id, detalle: { fecha: parsed.data.fecha } });
  revalidatePath(`/tenants/${parsed.data.tenant_id}`);
}
