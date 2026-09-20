import type { AppUser } from "@/lib/auth";
import { getPortalData } from "@/lib/portal/data";
import { PanelShell } from "@/components/panel/shell";
import { Kpi } from "@/components/panel/kpi";
import { Badge } from "@/components/panel/badge";
import { SimpleBarChart } from "@/components/panel/bar-chart";
import { LeadsTable } from "@/components/panel/portal/leads-table";
import { BasicsForm } from "@/components/panel/portal/basics-form";
import { ChangeRequestForm } from "@/components/panel/portal/change-request-form";

export async function ClientPortal({ user }: { user: AppUser }) {
  const data = await getPortalData(user.id);

  if (!data.tenant) {
    return (
      <PanelShell user={user}>
        <div className="rounded-2xl border border-black/10 bg-[var(--bg)] p-8 text-center text-[var(--muted)]">
          Aún no tienes un sitio asignado a tu cuenta. Escríbenos y lo activamos.
        </div>
      </PanelShell>
    );
  }

  const t = data.tenant;
  const visitasMes = data.serie[data.serie.length - 1]?.visitas ?? 0;

  return (
    <PanelShell user={user}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{t.nombre_negocio}</h1>
          <Badge value={t.estado} />
        </div>
        {t.hostname ? (
          <a
            href={`https://${t.hostname}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
          >
            Ver mi sitio ↗
          </a>
        ) : null}
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Kpi label="Contactos del mes" value={String(data.leadsMes.length)} />
        <Kpi label="Visitas del mes" value={String(visitasMes)} />
        <Kpi label="Atendidos" value={String(data.leadsMes.filter((l) => l.estado === "atendido").length)} />
      </div>

      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-[var(--bg)] p-5">
          <h2 className="mb-3 font-semibold">Contactos · 6 meses</h2>
          <SimpleBarChart data={data.serie} xKey="mes" yKey="leads" />
        </div>
        <div className="rounded-2xl border border-black/10 bg-[var(--bg)] p-5">
          <h2 className="mb-3 font-semibold">Visitas · 6 meses</h2>
          <SimpleBarChart data={data.serie} xKey="mes" yKey="visitas" color="#1d4ed8" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Tus contactos de este mes</h2>
        <LeadsTable leads={data.leadsMes} negocio={t.nombre_negocio} />
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-[var(--bg)] p-6">
          <h2 className="mb-4 text-lg font-semibold">Editar datos básicos</h2>
          {data.content ? (
            <BasicsForm tenantId={t.id} content={data.content} />
          ) : (
            <p className="text-sm text-[var(--muted)]">Tu contenido se está preparando.</p>
          )}
        </div>
        <div className="rounded-2xl border border-black/10 bg-[var(--bg)] p-6">
          <h2 className="mb-4 text-lg font-semibold">Solicitar un cambio mayor</h2>
          <ChangeRequestForm tenantId={t.id} />
        </div>
      </section>
    </PanelShell>
  );
}
