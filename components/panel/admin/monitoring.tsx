import type { ReactNode } from "react";
import { getMonitoringOverview, type Alerta } from "@/lib/admin/monitoring";
import { Kpi } from "@/components/panel/kpi";

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dur(ms: number | null): string {
  if (ms === null) return "—";
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

const JOB_STYLE: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-800",
  error: "bg-red-100 text-red-800",
  running: "bg-sky-100 text-sky-800",
};
const JOB_LABEL: Record<string, string> = { success: "OK", error: "Falló", running: "Corriendo" };

const SEV_STYLE: Record<Alerta["severidad"], string> = {
  alta: "bg-red-100 text-red-800",
  media: "bg-amber-100 text-amber-800",
  baja: "bg-slate-100 text-slate-700",
};

const NIVEL_STYLE: Record<string, string> = {
  error: "bg-red-100 text-red-800",
  warn: "bg-amber-100 text-amber-800",
  info: "bg-sky-100 text-sky-800",
};

const ACCION_LABEL: Record<string, string> = {
  "tenant.creado": "Creó cliente",
  "tenant.estado": "Cambió estado",
  "contenido.publicado": "Publicó contenido",
  "contenido.editado": "Editó contenido",
  "cambio.solicitado": "Solicitó cambio",
  "lead.atendido": "Atendió contacto",
  "publicidad.registrada": "Registró gasto de publicidad",
  "publicidad.eliminada": "Eliminó gasto de publicidad",
};

function Pill({ text, cls }: { text: string; cls: string }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{text}</span>;
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/10 bg-[var(--bg)]">
      <h2 className="border-b border-black/10 px-5 py-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-5 py-8 text-center text-sm text-[var(--muted)]">{text}</p>;
}

export async function MonitoringView() {
  const data = await getMonitoringOverview();
  const { salud } = data;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Monitoreo y logs</h1>

      {salud.degradado ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ⚠️ Algunas consultas de monitoreo no respondieron; los números de abajo pueden estar incompletos. Reintenta en unos minutos.
        </div>
      ) : null}

      {/* Estado del sistema */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Base de datos" value={salud.dbOk ? "Operativa" : "Con problemas"} />
        <Kpi label="Errores (24 h)" value={String(salud.erroresUlt24h)} hint="registros de error recientes" />
        <Kpi label="Tareas fallidas (7 d)" value={String(salud.jobsFallidos7d)} hint="corridas de cron con error" />
        <Kpi
          label="Último reporte mensual"
          value={fmt(salud.ultimoMonthly?.started_at ?? null)}
          hint={salud.ultimoMonthly ? JOB_LABEL[salud.ultimoMonthly.estado] ?? salud.ultimoMonthly.estado : "sin corridas aún"}
        />
      </div>

      {/* Notificaciones por correo */}
      <Card title="Avisos por correo de nuevos prospectos">
        {data.config.listo ? (
          <div className="px-5 py-4 text-sm">
            <p className="flex items-center gap-2 font-medium text-emerald-700">
              <span>✓</span> Configurado. Cada nuevo prospecto te llega a{" "}
              <span className="font-semibold">{data.config.operadorEmail}</span>.
            </p>
            {!data.config.remitentePropio ? (
              <p className="mt-2 text-xs text-[var(--muted)]">
                Estás usando el remitente de prueba de Resend. En ese modo el correo{" "}
                <strong>sólo llega a la dirección con la que creaste la cuenta de Resend</strong>. Si no lo ves, revisa
                que <span className="font-medium">{data.config.operadorEmail}</span> sea esa misma dirección y mira la
                carpeta de spam/promociones.
              </p>
            ) : (
              <p className="mt-2 text-xs text-[var(--muted)]">Remitente propio con dominio verificado. ✓</p>
            )}
          </div>
        ) : (
          <div className="px-5 py-4 text-sm">
            <p className="flex items-center gap-2 font-medium text-amber-700">
              <span>⚠️</span> Aún no está listo. Los prospectos se guardan siempre en la pestaña “Prospectos”, pero el
              aviso por correo no se enviará hasta completar esto:
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li className="flex items-center gap-2">
                <span>{data.config.resendKey ? "✓" : "✗"}</span>
                <span className={data.config.resendKey ? "" : "text-[var(--muted)]"}>
                  Clave de Resend (RESEND_API_KEY) {data.config.resendKey ? "configurada" : "falta"}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span>{data.config.operadorEmail ? "✓" : "✗"}</span>
                <span className={data.config.operadorEmail ? "" : "text-[var(--muted)]"}>
                  Correo de destino (OPERADOR_EMAIL){" "}
                  {data.config.operadorEmail ? `= ${data.config.operadorEmail}` : "falta"}
                </span>
              </li>
            </ul>
          </div>
        )}
      </Card>

      {/* Alertas de negocio */}
      <Card title="Alertas de negocio">
        {data.alertas.length === 0 ? (
          <Empty text="Sin alertas. Todo en orden. 🎉" />
        ) : (
          <ul className="divide-y divide-black/5">
            {data.alertas.map((a) => (
              <li key={a.tipo} className="flex items-start gap-3 px-5 py-3">
                <Pill text={a.severidad} cls={SEV_STYLE[a.severidad]} />
                <div>
                  <p className="text-sm font-medium">{a.titulo}</p>
                  {a.detalle ? <p className="text-xs text-[var(--muted)]">{a.detalle}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Tareas automáticas */}
      <Card title="Tareas automáticas (crons)">
        {data.jobs.length === 0 ? (
          <Empty text="Aún no hay corridas registradas. Aparecerán cuando se ejecuten los reportes." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 text-xs uppercase text-[var(--muted)]">
                <tr>
                  <th className="px-5 py-2">Tarea</th>
                  <th className="px-5 py-2">Estado</th>
                  <th className="px-5 py-2">Inicio</th>
                  <th className="px-5 py-2 text-right">Duración</th>
                  <th className="px-5 py-2">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {data.jobs.map((j) => (
                  <tr key={j.id} className="border-b border-black/5">
                    <td className="px-5 py-3 font-medium">{j.job}</td>
                    <td className="px-5 py-3"><Pill text={JOB_LABEL[j.estado] ?? j.estado} cls={JOB_STYLE[j.estado] ?? "bg-slate-100 text-slate-700"} /></td>
                    <td className="px-5 py-3 tabular-nums">{fmt(j.started_at)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{dur(j.duration_ms)}</td>
                    <td className="px-5 py-3 text-[var(--muted)]">{j.error ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Actividad reciente (auditoría) */}
      <Card title="Actividad reciente (auditoría)">
        {data.auditoria.length === 0 ? (
          <Empty text="Aún no hay actividad registrada. Cada acción del panel quedará aquí." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 text-xs uppercase text-[var(--muted)]">
                <tr>
                  <th className="px-5 py-2">Fecha</th>
                  <th className="px-5 py-2">Quién</th>
                  <th className="px-5 py-2">Acción</th>
                  <th className="px-5 py-2">Negocio</th>
                </tr>
              </thead>
              <tbody>
                {data.auditoria.map((a) => (
                  <tr key={a.id} className="border-b border-black/5">
                    <td className="px-5 py-3 tabular-nums">{fmt(a.created_at)}</td>
                    <td className="px-5 py-3">
                      {a.actor_email ?? "sistema"}
                      {a.actor_rol ? <span className="ml-1 text-xs text-[var(--muted)]">({a.actor_rol})</span> : null}
                    </td>
                    <td className="px-5 py-3">{ACCION_LABEL[a.accion] ?? a.accion}</td>
                    <td className="px-5 py-3 text-[var(--muted)]">{a.tenant_nombre ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Errores */}
      <Card title="Errores">
        {data.errores.length === 0 ? (
          <Empty text="Sin errores registrados. 🎉" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 text-xs uppercase text-[var(--muted)]">
                <tr>
                  <th className="px-5 py-2">Fecha</th>
                  <th className="px-5 py-2">Nivel</th>
                  <th className="px-5 py-2">Origen</th>
                  <th className="px-5 py-2">Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {data.errores.map((e) => (
                  <tr key={e.id} className="border-b border-black/5">
                    <td className="px-5 py-3 tabular-nums">{fmt(e.created_at)}</td>
                    <td className="px-5 py-3"><Pill text={e.nivel} cls={NIVEL_STYLE[e.nivel] ?? "bg-slate-100 text-slate-700"} /></td>
                    <td className="px-5 py-3 font-medium">{e.origen}</td>
                    <td className="px-5 py-3 text-[var(--muted)]">{e.mensaje}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
