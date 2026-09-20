import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { deviceFromUserAgent } from "@/lib/utm";

export const runtime = "nodejs";

const zPageview = z
  .object({
    tenant_id: z.string().uuid(),
    path: z.string().max(500),
    referrer: z.string().max(500).optional(),
  })
  .strict();

function referrerHost(referrer: string | undefined): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).host;
  } catch {
    return null;
  }
}

/** Ingesta de una visita sin cookies (analítica propia liviana). */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = zPageview.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 422 });

  const hdrs = await headers();
  const supabase = createAdminClient();
  // Solo registramos visitas de tenants activos (evita basura de dominios inactivos).
  const { data: tenant } = await supabase
    .from("tenants")
    .select("estado")
    .eq("id", parsed.data.tenant_id)
    .maybeSingle();
  if (!tenant || tenant.estado !== "activo") return NextResponse.json({ ok: true });

  await supabase.from("page_views").insert({
    tenant_id: parsed.data.tenant_id,
    path: parsed.data.path,
    referrer_host: referrerHost(parsed.data.referrer),
    device: deviceFromUserAgent(hdrs.get("user-agent")),
  });

  return NextResponse.json({ ok: true });
}
