import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "@/lib/env";
import { getServiceRoleKey } from "@/lib/env.server";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Cliente con service_role. BYPASSA RLS -> SOLO server-side.
 * Úsalo para: render ISR de landings, ingesta de leads/visitas y crons.
 * Jamás lo importes desde un componente cliente.
 */

let cached: SupabaseClient<Database> | null = null;

export function createAdminClient(): SupabaseClient<Database> {
  if (cached) return cached;
  const { url } = getPublicSupabaseEnv();
  cached = createClient<Database>(url, getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
