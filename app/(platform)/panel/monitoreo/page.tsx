import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { PanelShell } from "@/components/panel/shell";
import { MonitoringView } from "@/components/panel/admin/monitoring";
import { ADMIN_NAV } from "@/lib/admin/nav";

export const metadata: Metadata = { title: "Monitoreo", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MonitoreoPage() {
  const user = await requireAdmin();
  return (
    <PanelShell user={user} nav={ADMIN_NAV}>
      <MonitoringView />
    </PanelShell>
  );
}
