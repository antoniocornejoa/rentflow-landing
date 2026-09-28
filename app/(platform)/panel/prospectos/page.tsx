import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { PanelShell } from "@/components/panel/shell";
import { ProspectsView } from "@/components/panel/admin/prospects";
import { ADMIN_NAV } from "@/lib/admin/nav";

export const metadata: Metadata = { title: "Prospectos", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ProspectosPage() {
  const user = await requireAdmin();
  return (
    <PanelShell user={user} nav={ADMIN_NAV}>
      <ProspectsView />
    </PanelShell>
  );
}
