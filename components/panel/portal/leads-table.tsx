"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markLeadAttended } from "@/app/(platform)/panel/portal/actions";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { Badge } from "@/components/panel/badge";
import type { PortalLead } from "@/lib/portal/data";

const ORIGEN_LABEL: Record<string, string> = { formulario: "Formulario", whatsapp: "WhatsApp", llamada: "Llamada" };

export function LeadsTable({ leads, negocio }: { leads: PortalLead[]; negocio: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function atender(id: string) {
    start(async () => {
      await markLeadAttended(id);
      router.refresh();
    });
  }

  if (leads.length === 0) {
    return <p className="rounded-2xl border border-black/10 bg-[var(--bg)] p-6 text-center text-[var(--muted)]">Aún no hay contactos este mes.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/10 bg-[var(--bg)]">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-black/10 text-xs uppercase text-[var(--muted)]">
          <tr>
            <th className="px-4 py-2">Nombre</th>
            <th className="px-4 py-2">Teléfono</th>
            <th className="px-4 py-2">Origen</th>
            <th className="px-4 py-2">Fecha</th>
            <th className="px-4 py-2">Estado</th>
            <th className="px-4 py-2 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => {
            const fecha = new Date(l.created_at).toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
            const wa = l.telefono
              ? buildWhatsappUrl(l.telefono, `Hola ${l.nombre ?? ""}, gracias por contactar a ${negocio}.`)
              : null;
            return (
              <tr key={l.id} className="border-b border-black/5">
                <td className="px-4 py-3 font-medium">{l.nombre ?? "—"}</td>
                <td className="px-4 py-3">{l.telefono ?? l.email ?? "—"}</td>
                <td className="px-4 py-3">{ORIGEN_LABEL[l.origen] ?? l.origen}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{fecha}</td>
                <td className="px-4 py-3">
                  <Badge value={l.estado === "atendido" ? "activo" : "pendiente"} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {wa ? (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Responder
                      </a>
                    ) : null}
                    {l.estado !== "atendido" ? (
                      <button
                        onClick={() => atender(l.id)}
                        disabled={pending}
                        className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                      >
                        Marcar atendido
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
