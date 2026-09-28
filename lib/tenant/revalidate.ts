import "server-only";
import { revalidateTag } from "next/cache";
import { tenantTag, tenantHostTag } from "@/lib/tenant/resolve";

/**
 * Invalida la cache de render de un tenant (contenido + estado) para que los
 * cambios se reflejen de inmediato, sin esperar el revalidate de 3600s.
 */
export function revalidateTenant(tenantId: string): void {
  revalidateTag(tenantTag(tenantId));
}

/**
 * Invalida la resolución host -> tenant. Se llama al crear/verificar un dominio,
 * para que un host que se hubiera pedido antes de existir (y quedado en 404
 * cacheado por el ISR) se refresque de inmediato en su primera visita real.
 */
export function revalidateTenantHost(host: string): void {
  revalidateTag(tenantHostTag(host.toLowerCase()));
}
