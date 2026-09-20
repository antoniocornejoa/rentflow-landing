import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { zLeadInput } from "@/lib/leads";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { deviceFromUserAgent } from "@/lib/utm";
import { verifyTurnstile } from "@/lib/turnstile";
import { originAllowed } from "@/lib/request-origin";
import { sendEmail, escapeHtml } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "json inválido" }, { status: 400 });
  }

  const parsed = zLeadInput.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "datos inválidos" }, { status: 422 });
  const input = parsed.data;

  // Honeypot: aceptar en silencio y descartar (no alertar al bot).
  if (input.hp) return NextResponse.json({ ok: true });

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const supabase = createAdminClient();

  const [{ data: tenant, error: tenantError }, { data: domains }] = await Promise.all([
    supabase.from("tenants").select("id, estado, nombre_negocio").eq("id", input.tenant_id).maybeSingle(),
    supabase.from("tenant_domains").select("hostname").eq("tenant_id", input.tenant_id),
  ]);
  if (tenantError) return NextResponse.json({ error: "error" }, { status: 500 });
  if (!tenant || tenant.estado !== "activo") {
    return NextResponse.json({ error: "tenant no disponible" }, { status: 404 });
  }

  // El lead debe originarse en el propio sitio del tenant (evita spoofing cruzado).
  const allowedHosts = (domains ?? []).map((d) => d.hostname);
  if (!originAllowed(req, allowedHosts)) {
    return NextResponse.json({ error: "origen no permitido" }, { status: 403 });
  }

  // Turnstile para todo lead que persiste con datos (no el clic de WhatsApp).
  // verifyTurnstile devuelve true si no hay secret configurado (no bloquea en dev).
  if (input.origen !== "whatsapp") {
    const ok = await verifyTurnstile(input.turnstileToken, ip);
    if (!ok) return NextResponse.json({ error: "verificación anti-spam falló" }, { status: 403 });
  }

  const t = input.tracking ?? {};
  const device = deviceFromUserAgent(hdrs.get("user-agent"));

  const { data: lead, error: insertError } = await supabase
    .from("leads")
    .insert({
      tenant_id: input.tenant_id,
      origen: input.origen,
      nombre: input.nombre ?? null,
      telefono: input.telefono ?? null,
      email: input.email ? input.email : null,
      mensaje: input.mensaje ?? null,
      metadata: (input.metadata ?? {}) as unknown as Json,
      utm_source: t.utm_source ?? null,
      utm_medium: t.utm_medium ?? null,
      utm_campaign: t.utm_campaign ?? null,
      utm_term: t.utm_term ?? null,
      utm_content: t.utm_content ?? null,
      referrer: t.referrer ?? null,
      path: t.path ?? null,
      device,
    })
    .select("id")
    .single();

  if (insertError) return NextResponse.json({ error: "no se pudo guardar" }, { status: 500 });

  // Notificación al dueño solo para envíos de formulario (verificados por Turnstile).
  if (input.origen === "formulario") {
    void notifyOwner(supabase, tenant.id, tenant.nombre_negocio, input);
  }

  return NextResponse.json({ ok: true, id: lead.id });
}

async function notifyOwner(
  supabase: ReturnType<typeof createAdminClient>,
  tenantId: string,
  nombreNegocio: string,
  input: ReturnType<typeof zLeadInput.parse>,
) {
  try {
    const { data: tu } = await supabase
      .from("tenant_users")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .limit(1)
      .maybeSingle();
    if (!tu) return;
    const { data: owner } = await supabase.from("users").select("email").eq("id", tu.user_id).maybeSingle();
    if (!owner?.email) return;

    const filas = [
      ["Nombre", input.nombre],
      ["Teléfono", input.telefono],
      ["Email", input.email],
      ["Mensaje", input.mensaje],
    ]
      .filter(([, v]) => v)
      .map(
        ([k, v]) =>
          `<tr><td style="padding:4px 12px 4px 0;color:#64748b">${k}</td><td style="padding:4px 0">${escapeHtml(String(v))}</td></tr>`,
      )
      .join("");

    await sendEmail({
      to: owner.email,
      replyTo: input.email || undefined,
      subject: `${nombreNegocio}: nuevo contacto desde tu sitio`,
      html: `<div style="font-family:sans-serif"><h2>Nuevo contacto</h2><table>${filas}</table><p style="color:#94a3b8;font-size:12px">Enviado por RentFlow</p></div>`,
    });
  } catch {
    // best-effort
  }
}
