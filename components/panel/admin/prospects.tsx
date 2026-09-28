import { getProspects } from "@/lib/admin/prospects";
import { Kpi } from "@/components/panel/kpi";

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ESTADO_STYLE: Record<string, string> = {
  nuevo: "bg-sky-100 text-sky-800",
  contactado: "bg-amber-100 text-amber-800",
  propuesta: "bg-violet-100 text-violet-800",
  convertido: "bg-emerald-100 text-emerald-800",
  descartado: "bg-slate-200 text-slate-700",
};
const ESTADO_LABEL: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  propuesta: "Propuesta",
  convertido: "Convertido",
  descartado: "Descartado",
};

export async function ProspectsView() {
  const data = await getProspects();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Prospectos</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Interesados que enviaron el formulario del sitio comercial (&ldquo;Quiero mi página&rdquo;).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Kpi label="Total prospectos" value={String(data.total)} />
        <Kpi label="Nuevos (sin contactar)" value={String(data.nuevos)} />
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
                  <th className="px-5 py-2">Fecha</th>
                  <th className="px-5 py-2">Nombre / Empresa</th>
                  <th className="px-5 py-2">Contacto</th>
                  <th className="px-5 py-2">Interés</th>
                  <th className="px-5 py-2">Mensaje</th>
                  <th className="px-5 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.prospects.map((p) => (
                  <tr key={p.id} className="border-b border-black/5 align-top">
                    <td className="whitespace-nowrap px-5 py-3 tabular-nums text-[var(--muted)]">{fmt(p.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{p.nombre}</div>
                      {p.empresa ? <div className="text-xs text-[var(--muted)]">{p.empresa}</div> : null}
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
                    <td className="max-w-xs px-5 py-3 text-[var(--muted)]">{p.mensaje ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_STYLE[p.estado] ?? "bg-slate-100 text-slate-700"}`}>
                        {ESTADO_LABEL[p.estado] ?? p.estado}
                      </span>
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
