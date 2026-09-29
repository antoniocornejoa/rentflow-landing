import Link from "next/link";
import { notFound } from "next/navigation";
import { getProspectDetail } from "@/lib/admin/prospects";
import {
  ESTADOS,
  ESTADO_LABEL,
  ACTIVIDAD_TIPOS,
  ACTIVIDAD_LABEL,
  ACTIVIDAD_ICON,
} from "@/lib/prospects/seguimiento";
import { changeEstado, setProximoSeguimiento, addActivity } from "@/app/(platform)/panel/prospectos/actions";

const field = "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 outline-none focus:border-[var(--brand)]";

const ESTADO_STYLE: Record<string, string> = {
  nuevo: "bg-sky-100 text-sky-800",
  contactado: "bg-amber-100 text-amber-800",
  propuesta: "bg-violet-100 text-violet-800",
  convertido: "bg-emerald-100 text-emerald-800",
  descartado: "bg-slate-200 text-slate-700",
};

function fmtFecha(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
}
function fmtDT(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export async function ProspectDetailView({ id }: { id: string }) {
  const p = await getProspectDetail(id);
  if (!p) notFound();

  const hoy = new Date().toISOString().slice(0, 10);
  const atrasado = p.proximo_seguimiento !== null && p.proximo_seguimiento < hoy && !["convertido", "descartado"].includes(p.estado);
  const wa = p.telefono ? p.telefono.replace(/[^0-9]/g, "") : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/prospectos" className="text-sm text-[var(--muted)] hover:underline">
          ← Volver a Prospectos
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{p.nombre}</h1>
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_STYLE[p.estado] ?? "bg-slate-100 text-slate-700"}`}>
            {ESTADO_LABEL[p.estado] ?? p.estado}
          </span>
        </div>
        {p.empresa ? <p className="text-sm text-[var(--muted)]">{p.empresa}</p> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Columna izquierda: contacto + acciones */}
        <aside className="flex flex-col gap-6">
          <section className="rounded-2xl border border-black/10 bg-[var(--bg)] p-5">
            <h2 className="text-sm font-semibold text-[var(--muted)]">Contacto</h2>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              {wa ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted)]">WhatsApp</dt>
                  <dd><a href={`https://wa.me/${wa}`} className="text-[var(--brand)] hover:underline">{p.telefono}</a></dd>
                </div>
              ) : null}
              {p.email ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted)]">Email</dt>
                  <dd className="min-w-0 break-all text-right"><a href={`mailto:${p.email}`} className="text-[var(--brand)] hover:underline">{p.email}</a></dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--muted)]">Interés</dt>
                <dd className="text-right capitalize">{[p.plan_interes, p.plantilla_interes].filter(Boolean).join(" · ") || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--muted)]">Llegó</dt>
                <dd className="text-right">{fmtFecha(p.created_at.slice(0, 10))}</dd>
              </div>
            </dl>
            {p.mensaje ? (
              <p className="mt-3 border-t border-black/5 pt-3 text-sm text-[var(--muted)]">&ldquo;{p.mensaje}&rdquo;</p>
            ) : null}
          </section>

          {/* Etapa */}
          <section className="rounded-2xl border border-black/10 bg-[var(--bg)] p-5">
            <h2 className="text-sm font-semibold text-[var(--muted)]">Etapa</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {ESTADOS.map((e) => {
                const activo = p.estado === e;
                return (
                  <form key={e} action={changeEstado}>
                    <input type="hidden" name="prospect_id" value={p.id} />
                    <input type="hidden" name="estado" value={e} />
                    <button
                      type="submit"
                      disabled={activo}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        activo
                          ? "bg-[var(--brand)] text-white"
                          : "border border-black/10 text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
                      }`}
                    >
                      {ESTADO_LABEL[e]}
                    </button>
                  </form>
                );
              })}
            </div>
            {p.estado === "convertido" && !p.convertido_tenant_id ? (
              <Link href="/tenants/nuevo" className="mt-3 inline-block text-xs text-[var(--brand)] hover:underline">
                → Crear como cliente (tenant)
              </Link>
            ) : null}
          </section>

          {/* Próximo seguimiento */}
          <section className="rounded-2xl border border-black/10 bg-[var(--bg)] p-5">
            <h2 className="text-sm font-semibold text-[var(--muted)]">Próximo seguimiento</h2>
            {atrasado ? <p className="mt-1 text-xs font-medium text-red-600">Atrasado</p> : null}
            <form action={setProximoSeguimiento} className="mt-3 flex items-end gap-2">
              <input type="hidden" name="prospect_id" value={p.id} />
              <input type="date" name="fecha" defaultValue={p.proximo_seguimiento ?? ""} className={field} />
              <button type="submit" className="shrink-0 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white">
                Guardar
              </button>
            </form>
            <p className="mt-2 text-xs text-[var(--muted)]">Deja la fecha vacía y guarda para quitarlo.</p>
          </section>
        </aside>

        {/* Columna derecha: registrar + línea de tiempo */}
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-black/10 bg-[var(--bg)] p-5">
            <h2 className="mb-3 text-lg font-semibold">Registrar avance</h2>
            <form action={addActivity} className="flex flex-col gap-3">
              <input type="hidden" name="prospect_id" value={p.id} />
              <select name="tipo" defaultValue="nota" className={field}>
                {ACTIVIDAD_TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {ACTIVIDAD_ICON[t]} {ACTIVIDAD_LABEL[t]}
                  </option>
                ))}
              </select>
              <textarea name="detalle" rows={3} placeholder="¿Qué pasó? Ej: Llamé, quedó de confirmar el viernes." className={field} />
              <button type="submit" className="justify-self-start rounded-full bg-[var(--brand)] px-6 py-2.5 font-semibold text-white">
                Agregar a la línea de tiempo
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-black/10 bg-[var(--bg)]">
            <h2 className="border-b border-black/10 px-5 py-3 text-lg font-semibold">Línea de tiempo</h2>
            {p.actividades.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[var(--muted)]">
                Aún no hay avances registrados. Registra el primero arriba.
              </p>
            ) : (
              <ol className="flex flex-col">
                {p.actividades.map((a) => (
                  <li key={a.id} className="flex gap-3 border-b border-black/5 px-5 py-3 last:border-0">
                    <span className="text-lg leading-none" aria-hidden>{ACTIVIDAD_ICON[a.tipo] ?? "•"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">
                        {a.tipo === "cambio_estado"
                          ? `Pasó a ${ESTADO_LABEL[a.estado_nuevo ?? ""] ?? a.estado_nuevo}`
                          : ACTIVIDAD_LABEL[a.tipo] ?? a.tipo}
                      </div>
                      {a.detalle ? <p className="mt-0.5 text-sm text-[var(--muted)]">{a.detalle}</p> : null}
                      <time className="text-xs text-[var(--muted)]">{fmtDT(a.created_at)}</time>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
