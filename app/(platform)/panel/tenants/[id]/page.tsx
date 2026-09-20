import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PanelShell } from "@/components/panel/shell";
import { Badge } from "@/components/panel/badge";
import { ContentEditor } from "@/components/panel/admin/content-editor";
import { setTenantEstado } from "@/app/(platform)/panel/tenants/actions";
import type { Plantilla } from "@/lib/content/schema";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, nombre_negocio, slug, plan, estado, plantilla")
    .eq("id", id)
    .maybeSingle();
  if (!tenant) notFound();

  const [{ data: content }, { data: domains }] = await Promise.all([
    supabase.from("tenant_content").select("content_published").eq("tenant_id", id).maybeSingle(),
    supabase.from("tenant_domains").select("hostname, is_primary, verificado").eq("tenant_id", id),
  ]);

  const primary = domains?.find((d) => d.is_primary) ?? domains?.[0];

  return (
    <PanelShell user={user} nav={[{ href: "/", label: "Resumen" }]}>
      <div className="mb-6">
        <Link href="/" className="text-sm text-[var(--muted)] hover:underline">
          ← Volver
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{tenant.nombre_negocio}</h1>
          <Badge value={tenant.estado} />
          <span className="text-sm text-[var(--muted)]">
            {tenant.plan} · {tenant.plantilla}
          </span>
        </div>
        {primary ? (
          <p className="mt-1 text-sm text-[var(--muted)]">
            {primary.hostname} {primary.verificado ? "" : "(dominio sin verificar)"}
          </p>
        ) : null}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <form action={setTenantEstado.bind(null, tenant.id, "activo")}>
          <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Activar</button>
        </form>
        <form action={setTenantEstado.bind(null, tenant.id, "suspendido")}>
          <button className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white">Suspender</button>
        </form>
        <form action={setTenantEstado.bind(null, tenant.id, "cancelado")}>
          <button className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600">
            Cancelar
          </button>
        </form>
      </div>

      <ContentEditor tenantId={tenant.id} plantilla={tenant.plantilla as Plantilla} initial={content?.content_published ?? {}} />
    </PanelShell>
  );
}
