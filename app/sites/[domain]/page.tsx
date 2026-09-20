import { notFound } from "next/navigation";
import { getTenantByHost } from "@/lib/tenant/resolve";
import { ComingSoon } from "@/components/estados/coming-soon";
import { Mantencion } from "@/components/estados/mantencion";

// ISR: la página se regenera cada hora y se invalida on-demand por tag al editar.
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ domain: string }>;
}

/**
 * Landing de un tenant. El host llega en `params.domain` (reescrito por el
 * middleware). Resolvemos el tenant y decidimos el render según su estado.
 * En Fase 2 el estado 'activo' renderiza la plantilla real; aquí va un
 * placeholder que demuestra la resolución multi-tenant.
 */
export default async function TenantLandingPage({ params }: PageProps) {
  const { domain } = await params;
  const host = decodeURIComponent(domain);
  const tenant = await getTenantByHost(host);

  // Dominio sin tenant, o tenant cancelado -> 404 neutro.
  if (!tenant || tenant.estado === "cancelado") notFound();

  if (tenant.estado === "onboarding") {
    return <ComingSoon nombre={tenant.nombre_negocio} />;
  }

  if (tenant.estado === "suspendido" || tenant.estado === "moroso") {
    return <Mantencion nombre={tenant.nombre_negocio} />;
  }

  // estado === 'activo' -> placeholder de Fase 1 (Fase 2 renderiza la plantilla).
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <span className="rounded-full border border-current/15 px-3 py-1 text-xs font-medium text-[var(--muted)]">
        Plantilla: {tenant.plantilla}
      </span>
      <h1 className="text-3xl font-semibold">{tenant.nombre_negocio}</h1>
      <p className="text-[var(--muted)]">
        Tenant resuelto correctamente desde <code>{host}</code>.
      </p>
      <p className="text-sm text-[var(--muted)]">
        La landing con la plantilla <strong>{tenant.plantilla}</strong> se
        construye en la Fase 2.
      </p>
    </main>
  );
}
