"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { ROOT_DOMAIN } from "@/lib/env";
import { revalidateTenant } from "@/lib/tenant/revalidate";
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
});

export type AltaState = { error?: string };

/** Alta de cliente: tenant + contenido/tema semilla + suscripción + dominio + dueño. */
export async function createTenant(_prev: AltaState, formData: FormData): Promise<AltaState> {
  await requireAdmin();

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

  // 3) Suscripción
  await supabase.from("subscriptions").insert({
    tenant_id: tenantId,
    plan: input.plan,
    monto: input.monto,
    dia_cobro: input.dia_cobro,
  });

  // 4) Dominio propio (subdominio bajo el wildcard, ya servible = verificado)
  await supabase.from("tenant_domains").insert({
    tenant_id: tenantId,
    hostname: `${input.slug}.${ROOT_DOMAIN}`.toLowerCase(),
    is_primary: true,
    verificado: true,
  });

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

  redirect(`/tenants/${tenantId}`);
}

/** Cambia el estado del tenant (activar / suspender / etc.) e invalida su cache. */
export async function setTenantEstado(tenantId: string, estado: string): Promise<void> {
  await requireAdmin();
  const parsed = z
    .enum(["onboarding", "activo", "suspendido", "moroso", "cancelado"])
    .safeParse(estado);
  if (!parsed.success) return;
  const supabase = createAdminClient();
  await supabase.from("tenants").update({ estado: parsed.data }).eq("id", tenantId);
  revalidateTenant(tenantId);
}

/** Guarda y publica el contenido de un tenant (validado con Zod). */
export async function saveContent(tenantId: string, plantilla: Plantilla, rawJson: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

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

  revalidateTenant(tenantId);
  return { ok: true };
}
