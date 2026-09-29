import Link from "next/link";
import { getProspects, type SeguimientoEstado } from "@/lib/admin/prospects";
import { Kpi } from "@/components/panel/kpi";
import { ESTADO_LABEL } from "@/lib/prospects/seguimiento";

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function fmtFecha(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
}

const ESTADO_STYLE: Record<string, string> = {
  nuevo: "bg-sky-100 text-sky-800",
  contactado: "bg-amber-100 text-amber-800",
  propuesta: "bg-violet-100 text-violet-800",
  convertido: "bg-emerald-100 text-emerald-800",
  descartado: "bg-slate-200 text-slate-700",
};

const SEG_STYLE: Record<Exclude<SeguimientoEstado, null>, string> = {
  atrasado: "bg-red-100 text-red-700",
  hoy: "bg-amber-100 text-amber-800",
  proximo: "bg-slate-100 text-slate-600",
};
const SEG_LABEL: Record<Exclude<SeguimientoEstado, null>, string> = {
  atrasado: "Atrasado",
  hoy: "Hoy",
  proximo: "Agendado",
};

export async function ProspectsView() {
  const data = await getProspects();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Prospectos</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Interesados del sitio comercial. Haz clic en uno para ver su ficha, registrar avances y agendar el próximo paso.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Total prospectos" value={String(data.total)} />
        <Kpi label="Nuevos (sin contactar)" value={String(data.nuevos)} />
        <Kpi label="Seguimiento atrasado" value={String(data.atrasados)} hint="pasó la fecha agendada" />
        <Kpi label="Seguimiento hoy" value={String(data.hoy)} hint="agendados para hoy" />
      </div>

      <section className="rounded-2xl border border-black/10 bg-[var(--bg)]">
        {data.prospects.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[var(--muted)]">
            Aún no hay prospectos. Los que lleguen desde el botón &ldquo;Quiero mi página&rdquo; aparecerán aquí.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 text-xs uppercase text-[var(--muted)]">
                <tr>
                  <th className="px-5 py-2">Nombre / Empresa</th>
                  <th className="px-5 py-2">Contacto</th>
                  <th className="px-5 py-2">Interés</th>
                  <th className="px-5 py-2">Etapa</th>
                  <th className="px-5 py-2">Próximo paso</th>
                  <th className="px-5 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.prospects.map((p) => (
                  <tr key={p.id} className="border-b border-black/5 align-top">
                    <td className="px-5 py-3">
                      <Link href={`/prospectos/${p.id}`} className="font-medium text-[var(--brand)] hover:underline">
                        {p.nombre}
                      </Link>
                      {p.empresa ? <div className="text-xs text-[var(--muted)]">{p.empresa}</div> : null}
                      <div className="text-xs text-[var(--muted)]">Llegó {fmt(p.created_at)}</div>
                    </td>
                    <td className="px-5 py-3">
                      {p.telefono ? (
                        <a href={`https://wa.me/${p.telefono.replace(/[^0-9]/g, "")}`} className="text-[var(--brand)] hover:underline">
                          {p.telefono}
                        </a>
                      ) : null}
                      {p.email ? (
                        <div>
                          <a href={`mailto:${p.email}`} className="text-[var(--brand)] hover:underline">{p.email}</a>
                        </div>
                      ) : null}
                      {!p.telefono && !p.email ? <span className="text-[var(--muted)]">—</span> : null}
                    </td>
                    <td className="px-5 py-3 capitalize text-[var(--muted)]">
                      {[p.plan_interes, p.plantilla_interes].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_STYLE[p.estado] ?? "bg-slate-100 text-slate-700"}`}>
                        {ESTADO_LABEL[p.estado] ?? p.estado}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      {p.seguimiento ? (
                        <span className="flex items-center gap-2">
                          <span className="tabular-nums">{p.proximo_seguimiento ? fmtFecha(p.proximo_seguimiento) : ""}</span>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${SEG_STYLE[p.seguimiento]}`}>
                            {SEG_LABEL[p.seguimiento]}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[var(--muted)]">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <Link href={`/prospectos/${p.id}`} className="text-xs text-[var(--brand)] hover:underline">
                        Ver ficha →
                      </Link>
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
