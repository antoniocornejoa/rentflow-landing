"use client";

import type { ReactNode } from "react";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { captureTracking } from "@/lib/utm";

/**
 * Enlace a WhatsApp que REGISTRA el clic como lead (origen='whatsapp') antes de
 * redirigir, sin bloquear la apertura. En modo demo no registra nada.
 */
export function WhatsAppLink({
  tenantId,
  numero,
  mensaje,
  demo = false,
  className,
  children,
}: {
  tenantId?: string;
  numero: string;
  mensaje: string;
  demo?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const href = buildWhatsappUrl(numero, mensaje);

  function handleClick() {
    if (demo || !tenantId) return;
    try {
      const body = JSON.stringify({
        tenant_id: tenantId,
        origen: "whatsapp",
        mensaje,
        tracking: captureTracking(),
      });
      const blob = new Blob([body], { type: "application/json" });
      // sendBeacon no bloquea la navegación a wa.me.
      navigator.sendBeacon?.("/api/leads", blob);
    } catch {
      // Nunca impedir que el usuario llegue a WhatsApp.
    }
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
