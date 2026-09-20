import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantRender } from "@/lib/tenant/content";
import { TenantLanding } from "@/components/landing/tenant-landing";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Vista previa (para el iframe del editor). Renderiza el contenido publicado. */
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const supabase = createAdminClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("nombre_negocio")
    .eq("id", id)
    .maybeSingle();
  if (!tenant) notFound();

  const { content, theme, contentInvalid } = await getTenantRender(id);

  if (!content) {
    return (
      <main className="p-8 text-center text-[var(--muted)]">
        {contentInvalid ? "El contenido tiene errores de validación." : "Sin contenido aún."}
      </main>
    );
  }

  return <TenantLanding content={content} nombreNegocio={tenant.nombre_negocio} theme={theme} demo />;
}
