import Link from "next/link";
import { getAdminOverview } from "@/lib/admin/stats";
import { formatCLP } from "@/lib/format";
import { Kpi } from "@/components/panel/kpi";
import { Badge } from "@/components/panel/badge";
import { SimpleBarChart } from "@/components/panel/bar-chart";

export async function AdminDashboard() {
  const data = await getAdminOverview();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Resumen</h1>
        <Link
          href="/tenants/nuevo"
          className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
        >
          + Nuevo cliente
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="MRR" value={formatCLP(data.mrr)} hint="Ingreso recurrente mensual" />
        <Kpi label="Clientes activos" value={String(data.clientesActivos)} />
        <Kpi label="Leads del mes" value={String(data.leadsMes)} />
        <Kpi label="Churn del mes" value={String(data.churnMes)} hint="Cancelaciones" />
      </div>

      <section className="rounded-2xl border border-black/10 bg-[var(--bg)] p-5">
        <h2 className="mb-3 text-lg font-semibold">Leads · últimos 6 meses</h2>
        <SimpleBarChart data={data.leadsPorMes} xKey="mes" yKey="leads" />
      </section>

      <section className="rounded-2xl border border-black/10 bg-[var(--bg)]">
        <div className="flex items-center justify-between p-5">
          <h2 className="text-lg font-semibold">Clientes ({data.tenants.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-black/10 text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-5 py-2">Negocio</th>
                <th className="px-5 py-2">Plan</th>
                <th className="px-5 py-2">Estado</th>
                <th className="px-5 py-2">Pago</th>
                <th className="px-5 py-2 text-right">MRR</th>
                <th className="px-5 py-2 text-right">Leads mes</th>
              </tr>
            </thead>
            <tbody>
              {data.tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[var(--muted)]">
                    Aún no hay clientes. Crea el primero con “+ Nuevo cliente”.
                  </td>
                </tr>
              ) : (
                data.tenants.map((t) => (
                  <tr key={t.id} className="border-b border-black/5 hover:bg-black/[0.02]">
                    <td className="px-5 py-3">
                      <Link href={`/tenants/${t.id}`} className="font-medium text-[var(--brand)] hover:underline">
                        {t.nombre_negocio}
                      </Link>
                      <div className="text-xs text-[var(--muted)]">{t.slug}</div>
                    </td>
                    <td className="px-5 py-3 capitalize">{t.plan}</td>
                    <td className="px-5 py-3">
                      <Badge value={t.estado} />
                    </td>
                    <td className="px-5 py-3">{t.estado_pago ? <Badge value={t.estado_pago} /> : "—"}</td>
                    <td className="px-5 py-3 text-right">{formatCLP(t.mrr)}</td>
                    <td className="px-5 py-3 text-right">{t.leadsMes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
