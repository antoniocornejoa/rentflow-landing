import { z } from "zod";

/**
 * Variables PÚBLICAS (seguras para navegador y edge).
 * Deben referenciarse literalmente como process.env.NEXT_PUBLIC_* para que
 * Next.js las inyecte en el bundle.
 */

export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

const publicSupabaseSchema = z.object({
  url: z.string().url("NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida"),
  anonKey: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY es requerida"),
});

export type PublicSupabaseEnv = z.infer<typeof publicSupabaseSchema>;

let cachedPublic: PublicSupabaseEnv | null = null;

/** Valida y devuelve las credenciales públicas de Supabase (lazy). */
export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  if (cachedPublic) return cachedPublic;
  cachedPublic = publicSupabaseSchema.parse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  return cachedPublic;
}
