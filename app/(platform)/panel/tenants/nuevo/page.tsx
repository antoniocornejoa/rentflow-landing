import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ROOT_DOMAIN } from "@/lib/env";
import { PanelShell } from "@/components/panel/shell";
import { AltaForm } from "@/components/panel/admin/alta-form";

export const metadata: Metadata = { title: "Nuevo cliente", robots: { index: false, follow: false } };

export default async function NuevoTenantPage() {
  const user = await requireAdmin();
  return (
    <PanelShell user={user} nav={[{ href: "/", label: "Resumen" }]}>
      <div className="mb-6">
        <Link href="/" className="text-sm text-[var(--muted)] hover:underline">
          ← Volver al resumen
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Nuevo cliente</h1>
        <p className="text-sm text-[var(--muted)]">
          Crea el tenant, su contenido semilla, la suscripción y su subdominio inicial. Luego edita el contenido y actívalo.
        </p>
      </div>
      <AltaForm rootDomain={ROOT_DOMAIN} />
    </PanelShell>
  );
}
