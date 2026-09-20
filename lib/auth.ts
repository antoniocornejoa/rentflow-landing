import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export interface AppUser {
  id: string;
  email: string;
  nombre: string | null;
  rol: "admin" | "cliente";
}

/** Usuario autenticado + su perfil (public.users), o null si no hay sesión. */
export async function getAppUser(): Promise<AppUser | null> {
  // Sin Supabase configurado no puede haber sesión (evita romper el panel en dev).
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("id, email, nombre, rol")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) {
    // El perfil se crea por trigger; fallback defensivo.
    return { id: user.id, email: user.email ?? "", nombre: null, rol: "cliente" };
  }
  return data;
}

/** Exige sesión; si no hay, redirige al login (ruta pública del host del panel). */
export async function requireUser(): Promise<AppUser> {
  const user = await getAppUser();
  if (!user) redirect("/login");
  return user;
}

/** Exige rol admin; si no, al inicio del panel. */
export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser();
  if (user.rol !== "admin") redirect("/");
  return user;
}
