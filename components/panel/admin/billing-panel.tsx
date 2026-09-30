import { registrarPago, regalarMes, setProximoCobro } from "@/app/(platform)/panel/tenants/actions";
import { DIAS_MOROSO, DIAS_SUSPENDER } from "@/lib/billing";

const CLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export interface SubInfo {
  monto: number;
  moneda: string | null;
  dia_cobro: number;
  estado_pago: string;
  proximo_cobro: string | null;
  ultimo_pago: string | null;
}

const PAGO_STYLE: Record<string, string> = {
  al_dia: "bg-emerald-100 text-emerald-800",
  pendiente: "bg-amber-100 text-amber-800",
  vencido: "bg-red-100 text-red-700",
};
const PAGO_LABEL: Record<string, string> = { al_dia: "Al día", pendiente: "Pendiente", vencido: "Vencido" };

function fmtFecha(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
}

function estadoCobro(proximo: string | null): { texto: string; alerta: boolean } {
  if (!proximo) return { texto: "sin fecha definida", alerta: false };
  const hoy = new Date();
  const dias = Math.floor((Date.parse(hoy.toISOString().slice(0, 10)) - Date.parse(proximo)) / 86_400_000);
  if (dias > 0) return { texto: `vencido hace ${dias} día${dias === 1 ? "" : "s"}`, alerta: true };
  if (dias === 0) return { texto: "vence hoy", alerta: true };
  return { texto: `en ${-dias} día${dias === -1 ? "" : "s"}`, alerta: false };
}

export function BillingPanel({ tenantId, sub }: { tenantId: string; sub: SubInfo | null }) {
  if (!sub) {
    return (
      <section className="rounded-2xl border border-black/10 bg-[var(--bg)] p-5">
        <h2 className="text-lg font-semibold">Facturación</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Este cliente no tiene suscripción registrada.</p>
      </section>
    );
  }

  const cobro = estadoCobro(sub.proximo_cobro);

  return (
    <section className="mb-6 rounded-2xl border border-black/10 bg-[var(--bg)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Facturación</h2>
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${PAGO_STYLE[sub.estado_pago] ?? "bg-slate-100 text-slate-700"}`}>
          {PAGO_LABEL[sub.estado_pago] ?? sub.estado_pago}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-[var(--muted)]">Monto</dt>
          <dd className="font-medium tabular-nums">{CLP.format(sub.monto)}/mes</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Día de cobro</dt>
          <dd className="font-medium">{sub.dia_cobro}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Próximo cobro</dt>
          <dd className={`font-medium ${cobro.alerta ? "text-red-600" : ""}`}>
            {sub.proximo_cobro ? fmtFecha(sub.proximo_cobro) : "—"}
            <div className={`text-xs ${cobro.alerta ? "text-red-600" : "text-[var(--muted)]"}`}>{cobro.texto}</div>
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Último pago</dt>
          <dd className="font-medium">{sub.ultimo_pago ? fmtFecha(sub.ultimo_pago) : "—"}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap items-end gap-2">
        <form action={registrarPago.bind(null, tenantId)}>
          <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
            Registrar pago
          </button>
        </form>
        <form action={regalarMes.bind(null, tenantId)}>
          <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold hover:bg-black/5">
            Regalar 1 mes
          </button>
        </form>
        <form action={setProximoCobro} className="flex items-end gap-2">
          <input type="hidden" name="tenant_id" value={tenantId} />
          <label className="flex flex-col text-xs text-[var(--muted)]">
            Cambiar próximo cobro
            <input
              type="date"
              name="fecha"
              defaultValue={sub.proximo_cobro ?? undefined}
              className="mt-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
            />
          </label>
          <button className="rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold hover:bg-black/5">Guardar</button>
        </form>
      </div>

      <p className="mt-4 border-t border-black/5 pt-3 text-xs text-[var(--muted)]">
        Cobranza automática: a los <strong>{DIAS_MOROSO} días</strong> de atraso el cliente pasa a <strong>moroso</strong>{" "}
        (aviso, su página sigue arriba); a los <strong>{DIAS_SUSPENDER} días</strong> se <strong>suspende</strong> y su
        página queda en mantención hasta que registres el pago.
      </p>
    </section>
  );
}
