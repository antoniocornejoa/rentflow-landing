import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, escapeHtml } from "@/lib/email";
import { ROOT_DOMAIN } from "@/lib/env";

/**
 * Aviso diario de seguimientos pendientes: prospectos con próximo seguimiento
 * vencido (fecha <= hoy) que no estén convertidos ni descartados. Manda un
 * correo-resumen al operador (si OPERADOR_EMAIL + Resend están configurados).
 */
export async function runSeguimientos(): Promise<{ pendientes: number; enviado: boolean }> {
  const supabase = createAdminClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("prospects")
    .select("id, nombre, empresa, telefono, email, estado, proximo_seguimiento")
    .lte("proximo_seguimiento", hoy)
    .order("proximo_seguimiento", { ascending: true });
  if (error) throw error;

  const pend = (data ?? []).filter((p) => p.estado !== "convertido" && p.estado !== "descartado");
  if (pend.length === 0) return { pendientes: 0, enviado: false };

  const ops = process.env.OPERADOR_EMAIL;
  if (!ops) return { pendientes: pend.length, enviado: false };

  const panelHost = process.env.NEXT_PUBLIC_PLATFORM_HOST ?? `app.${ROOT_DOMAIN}`;
  const filas = pend
    .map((p) => {
      const contacto = p.telefono || p.email || "";
      const cuando = p.proximo_seguimiento === hoy ? "hoy" : `desde ${p.proximo_seguimiento}`;
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">
          <a href="https://${panelHost}/prospectos/${p.id}">${escapeHtml(p.nombre)}</a>
          ${p.empresa ? `<div style="color:#666;font-size:12px">${escapeHtml(p.empresa)}</div>` : ""}
        </td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;color:#666">${escapeHtml(contacto)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;color:#b45309">${cuando}</td>
      </tr>`;
    })
    .join("");

  const html = `<div style="font-family:sans-serif">
    <h2>Tienes ${pend.length} seguimiento(s) pendiente(s)</h2>
    <p>Prospectos con seguimiento agendado para hoy o atrasado:</p>
    <table style="border-collapse:collapse;width:100%">
      <thead><tr>
        <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #ddd">Prospecto</th>
        <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #ddd">Contacto</th>
        <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #ddd">Pendiente</th>
      </tr></thead>
      <tbody>${filas}</tbody>
    </table>
    <p style="margin-top:16px"><a href="https://${panelHost}/prospectos">Ver todos en el panel →</a></p>
  </div>`;

  const { sent } = await sendEmail({ to: ops, subject: `Seguimientos pendientes: ${pend.length}`, html });
  return { pendientes: pend.length, enviado: sent };
}
