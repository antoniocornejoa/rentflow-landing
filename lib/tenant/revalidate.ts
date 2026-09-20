import "server-only";
import { revalidateTag } from "next/cache";
import { tenantTag } from "@/lib/tenant/resolve";

/**
 * Invalida la cache de render de un tenant (contenido + estado) para que los
 * cambios se reflejen de inmediato, sin esperar el revalidate de 3600s.
 */
export function revalidateTenant(tenantId: string): void {
  revalidateTag(tenantTag(tenantId));
}
