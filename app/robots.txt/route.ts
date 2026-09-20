import { headers } from "next/headers";
import { classifyHost, normalizeHost } from "@/lib/domains";
import { getTenantByHost } from "@/lib/tenant/resolve";
import { getTenantRender } from "@/lib/tenant/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

function robots(body: string): Response {
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}

export async function GET() {
  const h = await headers();
  const rawHost = h.get("host");
  const host = normalizeHost(rawHost);
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;
  const { kind } = classifyHost(rawHost, ROOT_DOMAIN);

  // El panel/portal nunca se indexa.
  if (kind === "platform") return robots("User-agent: *\nDisallow: /\n");

  if (kind === "marketing") {
    return robots(`User-agent: *\nAllow: /\nDisallow: /panel\n\nSitemap: ${base}/sitemap.xml\n`);
  }

  // tenant: solo indexar si está activo y su SEO lo permite.
  const tenant = await getTenantByHost(host);
  if (!tenant || tenant.estado !== "activo") return robots("User-agent: *\nDisallow: /\n");
  const { content } = await getTenantRender(tenant.id);
  if (!content || content.seo.indexable === false) return robots("User-agent: *\nDisallow: /\n");

  return robots(`User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
}
