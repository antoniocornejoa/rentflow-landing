import { headers } from "next/headers";
import { classifyHost, normalizeHost } from "@/lib/domains";
import { getTenantByHost } from "@/lib/tenant/resolve";
import { getTenantRender } from "@/lib/tenant/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

function xml(urls: string[]): Response {
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n") +
    `\n</urlset>\n`;
  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8" } });
}

export async function GET() {
  const h = await headers();
  const rawHost = h.get("host");
  const host = normalizeHost(rawHost);
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;
  const { kind } = classifyHost(rawHost, ROOT_DOMAIN);

  if (kind === "platform") return xml([]);

  if (kind === "marketing") {
    return xml([`${base}/`, `${base}/demo`]);
  }

  const tenant = await getTenantByHost(host);
  if (!tenant || tenant.estado !== "activo") return xml([]);
  const { content } = await getTenantRender(tenant.id);
  if (!content || content.seo.indexable === false) return xml([]);
  return xml([`${base}/`]);
}
