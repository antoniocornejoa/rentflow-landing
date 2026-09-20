import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}
import { getPublicSupabaseEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Cliente Supabase con la sesión del usuario (anon key + cookies).
 * RLS SIEMPRE aplica. Úsalo en Server Components / Server Actions autenticados
 * (panel admin y portal cliente). Se usa a fondo desde la Fase 3.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  const { url, anonKey } = getPublicSupabaseEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Invocado desde un Server Component (no puede escribir cookies).
          // El middleware de sesión refresca el token en su lugar.
        }
      },
    },
  });
}
