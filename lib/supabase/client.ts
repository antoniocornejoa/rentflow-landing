import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Cliente Supabase para componentes de navegador (anon key).
 * RLS SIEMPRE aplica. Se usa desde la Fase 3 (login por magic link del portal).
 */
export function createBrowserSupabase() {
  const { url, anonKey } = getPublicSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
