import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

export type TenantEstado = Database["public"]["Enums"]["tenant_estado"];
export type PlantillaTipo = Database["public"]["Enums"]["plantilla_tipo"];

export interface ResolvedTenant {
  id: string;
  slug: string;
  nombre_negocio: string;
  plantilla: PlantillaTipo;
  estado: TenantEstado;
  hostname: string;
}

/** Tag por host: invalidar cuando cambian los dominios de un tenant. */
export function tenantHostTag(host: string): string {
  return `tenant-host:${host.toLowerCase()}`;
}

/** Tag por tenant: invalidar sus datos (estado/plantilla) en TODOS sus hosts a la vez. */
export function tenantTag(tenantId: string): string {
  return `tenant:${tenantId}`;
}

// ── Capa 1: host -> tenant_id (solo dominios VERIFICADOS) ────────────────────
async function fetchTenantIdByHost(host: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tenant_domains")
    .select("tenant_id")
    .eq("hostname", host)
    .eq("verificado", true)
    .maybeSingle();
  if (error) throw error;
  return data?.tenant_id ?? null;
}

function getTenantIdByHost(host: string): Promise<string | null> {
  return unstable_cache(
    () => fetchTenantIdByHost(host),
    ["tenant-id-by-host", host],
    { tags: [tenantHostTag(host)], revalidate: 3600 },
  )();
}

// ── Capa 2: tenant_id -> datos de render (invalidable por tenant) ────────────
async function fetchTenantData(
  tenantId: string,
): Promise<Omit<ResolvedTenant, "hostname"> | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, slug, nombre_negocio, plantilla, estado")
    .eq("id", tenantId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function getTenantData(
  tenantId: string,
): Promise<Omit<ResolvedTenant, "hostname"> | null> {
  return unstable_cache(
    () => fetchTenantData(tenantId),
    ["tenant-data", tenantId],
    { tags: [tenantTag(tenantId)], revalidate: 3600 },
  )();
}

/**
 * Resuelve el tenant a partir del host, en dos capas cacheadas:
 *   1) host -> tenant_id  (tag: tenant-host:{host})   [solo dominios verificados]
 *   2) tenant_id -> datos (tag: tenant:{id})          [invalidar al editar/suspender]
 * Así `revalidateTag(tenant:{id})` refresca el estado/plantilla en todos los hosts,
 * y `revalidateTag(tenant-host:{host})` refresca cuando cambian los dominios.
 * El render usa service_role, por lo que resuelve también tenants suspendidos/morosos
 * para decidir qué página mostrar.
 */
export async function getTenantByHost(host: string): Promise<ResolvedTenant | null> {
  const normalized = host.toLowerCase();
  const tenantId = await getTenantIdByHost(normalized);
  if (!tenantId) return null;
  const data = await getTenantData(tenantId);
  if (!data) return null;
  return { ...data, hostname: normalized };
}
