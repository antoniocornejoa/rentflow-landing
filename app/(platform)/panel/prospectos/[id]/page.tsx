import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { PanelShell } from "@/components/panel/shell";
import { ProspectDetailView } from "@/components/panel/admin/prospect-detail";
import { ADMIN_NAV } from "@/lib/admin/nav";

export const metadata: Metadata = { title: "Ficha de prospecto", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ProspectoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const { id } = await params;
  return (
    <PanelShell user={user} nav={ADMIN_NAV}>
      <ProspectDetailView id={id} />
    </PanelShell>
  );
}
