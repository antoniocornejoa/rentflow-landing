"use client";

import { useEffect } from "react";

/** Registra una visita (sin cookies) al montar. Fire-and-forget, no bloquea. */
export function PageviewBeacon({ tenantId }: { tenantId: string }) {
  useEffect(() => {
    try {
      const body = JSON.stringify({
        tenant_id: tenantId,
        path: window.location.pathname,
        referrer: document.referrer || undefined,
      });
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon?.("/api/track", blob);
    } catch {
      // nunca romper la página por analítica
    }
  }, [tenantId]);
  return null;
}
