import "server-only";
import { z } from "zod";

/**
 * Variables SECRETAS (solo servidor). Nunca deben llegar al navegador.
 * Se validan de forma lazy para no romper el build cuando aún no están definidas.
 */

let cachedServiceRoleKey: string | null = null;

/** service_role de Supabase. Bypassa RLS: solo uso server-side. */
export function getServiceRoleKey(): string {
  if (cachedServiceRoleKey) return cachedServiceRoleKey;
  cachedServiceRoleKey = z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY es requerida (solo servidor)")
    .parse(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return cachedServiceRoleKey;
}
