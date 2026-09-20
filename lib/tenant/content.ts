import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { tenantTag } from "@/lib/tenant/resolve";
import { parseTenantContent, type TenantContent } from "@/lib/content/schema";
import type { TenantTheme } from "@/lib/theme";

export interface TenantRender {
  content: TenantContent | null;
  /** true si el jsonb no pasó la validación Zod (render con fallback seguro). */
  contentInvalid: boolean;
  theme: TenantTheme | null;
}

async function fetchRender(tenantId: string): Promise<TenantRender> {
  const supabase = createAdminClient();
  const [contentRes, themeRes] = await Promise.all([
    supabase.from("tenant_content").select("content_published").eq("tenant_id", tenantId).maybeSingle(),
    supabase
      .from("tenant_theme")
      .select("colores, tipografia")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
  ]);

  if (contentRes.error) throw contentRes.error;

  let content: TenantContent | null = null;
  let contentInvalid = false;
  if (contentRes.data?.content_published) {
    const parsed = parseTenantContent(contentRes.data.content_published);
    if (parsed.ok) content = parsed.content;
    else contentInvalid = true;
  }

  const theme: TenantTheme | null = themeRes.data
    ? {
        colores: (themeRes.data.colores ?? undefined) as TenantTheme["colores"],
        tipografia: (themeRes.data.tipografia ?? undefined) as TenantTheme["tipografia"],
      }
    : null;

  return { content, contentInvalid, theme };
}

/** Contenido + tema publicados de un tenant, cacheado e invalidable por tenantTag. */
export async function getTenantRender(tenantId: string): Promise<TenantRender> {
  return unstable_cache(() => fetchRender(tenantId), ["tenant-render", tenantId], {
    tags: [tenantTag(tenantId)],
    revalidate: 3600,
  })();
}
