import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { zProspectInput } from "@/lib/prospects";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTurnstile } from "@/lib/turnstile";
import { originAllowed } from "@/lib/request-origin";
import { sendEmail, escapeHtml } from "@/lib/email";

export const runtime = "nodejs";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "json inválido" }, { status: 400 });
  }
  const parsed = zProspectInput.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "datos inválidos" }, { status: 422 });
  const input = parsed.data;
  if (input.hp) return NextResponse.json({ ok: true });

  // Debe venir del sitio comercial y pasar el anti-spam.
  if (!originAllowed(req, [ROOT_DOMAIN, `www.${ROOT_DOMAIN}`])) {
    return NextResponse.json({ error: "origen no permitido" }, { status: 403 });
  }
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const okCaptcha = await verifyTurnstile(input.turnstileToken, ip);
  if (!okCaptcha) return NextResponse.json({ error: "verificación anti-spam falló" }, { status: 403 });

  const t = input.tracking ?? {};
  const supabase = createAdminClient();
  const { error } = await supabase.from("prospects").insert({
    nombre: input.nombre,
    email: input.email ? input.email : null,
    telefono: input.telefono ?? null,
    empresa: input.empresa ?? null,
    plan_interes: input.plan_interes ? input.plan_interes : null,
    plantilla_interes: input.plantilla_interes ? input.plantilla_interes : null,
    mensaje: input.mensaje ?? null,
    origen: input.origen ?? null,
    utm_source: t.utm_source ?? null,
    utm_medium: t.utm_medium ?? null,
    utm_campaign: t.utm_campaign ?? null,
    utm_term: t.utm_term ?? null,
    utm_content: t.utm_content ?? null,
  });
  if (error) return NextResponse.json({ error: "no se pudo guardar" }, { status: 500 });

  const ops = process.env.OPERADOR_EMAIL;
  if (ops) {
    void sendEmail({
      to: ops,
      replyTo: input.email || undefined,
      subject: `Nuevo prospecto: ${input.nombre}`,
      html: `<div style="font-family:sans-serif"><h2>Nuevo prospecto</h2>
        <p><strong>Nombre:</strong> ${escapeHtml(input.nombre)}</p>
        <p><strong>Contacto:</strong> ${escapeHtml(input.email || input.telefono || "")}</p>
        <p><strong>Plan:</strong> ${input.plan_interes || "—"} · <strong>Plantilla:</strong> ${input.plantilla_interes || "—"}</p>
        ${input.mensaje ? `<p>${escapeHtml(input.mensaje)}</p>` : ""}</div>`,
    });
  }

  return NextResponse.json({ ok: true });
}
