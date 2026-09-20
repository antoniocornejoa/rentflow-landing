import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAppUser } from "@/lib/auth";
import { PanelShell } from "@/components/panel/shell";
import { AdminDashboard } from "@/components/panel/admin/dashboard";
import { ClientPortal } from "@/components/panel/portal/portal";

export const metadata: Metadata = { title: "Panel", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelHome() {
  const user = await getAppUser();
  if (!user) redirect("/login");

  if (user.rol === "admin") {
    return (
      <PanelShell
        user={user}
        nav={[
          { href: "/", label: "Resumen" },
          { href: "/tenants/nuevo", label: "Nuevo cliente" },
        ]}
      >
        <AdminDashboard />
      </PanelShell>
    );
  }

  return <ClientPortal user={user} />;
}
