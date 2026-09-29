import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { PanelShell } from "@/components/panel/shell";
import { MarketingView } from "@/components/panel/admin/marketing";
import { ADMIN_NAV } from "@/lib/admin/nav";

export const metadata: Metadata = { title: "Publicidad", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PublicidadPage() {
  const user = await requireAdmin();
  return (
    <PanelShell user={user} nav={ADMIN_NAV}>
      <MarketingView />
    </PanelShell>
  );
}
