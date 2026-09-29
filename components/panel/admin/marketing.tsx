import { getMarketingOverview } from "@/lib/admin/marketing";
import { Kpi } from "@/components/panel/kpi";
import { SimpleBarChart } from "@/components/panel/bar-chart";
import { SpendForm } from "@/components/panel/admin/spend-form";
import { deleteSpend } from "@/app/(platform)/panel/publicidad/actions";
import { CANAL_LABEL } from "@/lib/marketing/canales";

const CLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const fmt = (n: number) => CLP.format(n);

function fmtFecha(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "2-digit" });
}

export async function MarketingView() {
  const data = await getMarketingOverview();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Publicidad</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Registra cuánto inviertes en campañas para dar a conocer RentFlow y controla si la pauta rinde.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Gasto este mes" value={fmt(data.totalMes)} />
        <Kpi label="Gasto total" value={fmt(data.totalHistorico)} hint="histórico registrado" />
        <Kpi label="Prospectos (mes)" value={String(data.prospectosMes)} hint="interesados este mes" />
        <Kpi
          label="Costo por prospecto"
          value={data.costoPorProspecto === null ? "—" : fmt(data.costoPorProspecto)}
          hint="gasto ÷ prospectos del mes"
        />
      </div>

      {data.porMes.some((m) => m.monto > 0) ? (
        <section className="rounded-2xl border border-black/10 bg-[var(--bg)] p-5">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-[var(--muted)]">Gasto mes a mes</h2>
            <span className="text-xs text-[var(--muted)]">Últimos 6 meses · CLP</span>
          </div>
          <SimpleBarChart data={data.porMes} xKey="mes" yKey="monto" />
        </section>
      ) : null}

      {data.porCanal.length > 0 ? (
        <section className="rounded-2xl border border-black/10 bg-[var(--bg)] p-5">
          <h2 className="text-sm font-semibold text-[var(--muted)]">Gasto por canal (este mes)</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {data.porCanal.map((c) => {
              const pct = data.totalMes > 0 ? Math.round((c.monto / data.totalMes) * 100) : 0;
              return (
                <li key={c.canal} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm">{CANAL_LABEL[c.canal] ?? c.canal}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-black/5">
                    <span className="block h-full rounded-full bg-[var(--brand)]" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="w-24 shrink-0 text-right text-sm tabular-nums">{fmt(c.monto)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-black/10 bg-[var(--bg)] p-5">
        <h2 className="mb-4 text-lg font-semibold">Registrar gasto</h2>
        <SpendForm />
      </section>

      <section className="rounded-2xl border border-black/10 bg-[var(--bg)]">
        <h2 className="border-b border-black/10 px-5 py-3 text-lg font-semibold">Historial de gastos</h2>
        {data.entries.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[var(--muted)]">
            Aún no registras gastos de publicidad. Usa el formulario de arriba.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 text-xs uppercase text-[var(--muted)]">
                <tr>
                  <th className="px-5 py-2">Fecha</th>
                  <th className="px-5 py-2">Canal</th>
                  <th className="px-5 py-2">Campaña</th>
                  <th className="px-5 py-2 text-right">Monto</th>
                  <th className="px-5 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((e) => (
                  <tr key={e.id} className="border-b border-black/5 align-top">
                    <td className="whitespace-nowrap px-5 py-3 tabular-nums text-[var(--muted)]">{fmtFecha(e.fecha)}</td>
                    <td className="px-5 py-3">{CANAL_LABEL[e.canal] ?? e.canal}</td>
                    <td className="max-w-xs px-5 py-3">
                      <div>{e.campana ?? "—"}</div>
                      {e.notas ? <div className="text-xs text-[var(--muted)]">{e.notas}</div> : null}
                    </td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums">{fmt(e.monto)}</td>
                    <td className="px-5 py-3 text-right">
                      <form action={deleteSpend}>
                        <input type="hidden" name="id" value={e.id} />
                        <button type="submit" className="text-xs text-red-500 hover:underline">
                          Eliminar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
