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

/** Tag de cache por host para invalidar on-demand al editar/suspender un tenant. */
export function tenantHostTag(host: string): string {
  return `tenant-host:${host.toLowerCase()}`;
}

/** Tag de cache por tenant (para invalidar todos sus hosts a la vez, si se desea). */
export function tenantTag(tenantId: string): string {
  return `tenant:${tenantId}`;
}

async function fetchTenantByHost(host: string): Promise<ResolvedTenant | null> {
  const supabase = createAdminClient();

  const { data: domain, error: domainError } = await supabase
    .from("tenant_domains")
    .select("tenant_id")
    .eq("hostname", host)
    .maybeSingle();

  if (domainError) throw domainError;
  if (!domain) return null;

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, slug, nombre_negocio, plantilla, estado")
    .eq("id", domain.tenant_id)
    .maybeSingle();

  if (tenantError) throw tenantError;
  if (!tenant) return null;

  return { ...tenant, hostname: host };
}

/**
 * Resuelve el tenant a partir del host, cacheado (ISR: revalidate 3600 +
 * invalidación on-demand por tag). El render se hace con service_role, así que
 * también resuelve tenants suspendidos/morosos para decidir la página a mostrar.
 */
export async function getTenantByHost(host: string): Promise<ResolvedTenant | null> {
  const normalized = host.toLowerCase();
  const cached = unstable_cache(
    () => fetchTenantByHost(normalized),
    ["tenant-by-host", normalized],
    { tags: [tenantHostTag(normalized)], revalidate: 3600 },
  );
  return cached();
}
