import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenantByHost } from "@/lib/tenant/resolve";
import { getTenantRender } from "@/lib/tenant/content";
import { storageUrl } from "@/lib/storage";
import { ComingSoon } from "@/components/estados/coming-soon";
import { Mantencion } from "@/components/estados/mantencion";
import { TenantLanding } from "@/components/landing/tenant-landing";
import { PageviewBeacon } from "@/components/landing/pageview-beacon";

// ISR: se regenera cada hora y se invalida on-demand por tag al editar/suspender.
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ domain: string }>;
}

function imgUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : storageUrl(path);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { domain } = await params;
  const host = decodeURIComponent(domain);
  const tenant = await getTenantByHost(host);

  if (!tenant || tenant.estado === "cancelado") {
    return { title: "Sitio no encontrado", robots: { index: false, follow: false } };
  }
  if (tenant.estado !== "activo") {
    return { title: tenant.nombre_negocio, robots: { index: false, follow: false } };
  }

  const { content } = await getTenantRender(tenant.id);
  if (!content) return { title: tenant.nombre_negocio, robots: { index: false, follow: false } };

  const seo = content.seo;
  const og = seo.og_image ?? content.hero.imagen;
  return {
    title: seo.title,
    description: seo.description,
    robots: seo.indexable ? undefined : { index: false, follow: false },
    alternates: { canonical: seo.canonical ?? `https://${host}` },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `https://${host}`,
      type: "website",
      images: og ? [{ url: imgUrl(og.path) }] : undefined,
    },
  };
}

export default async function TenantLandingPage({ params }: PageProps) {
  const { domain } = await params;
  const host = decodeURIComponent(domain);
  const tenant = await getTenantByHost(host);

  if (!tenant || tenant.estado === "cancelado") notFound();
  if (tenant.estado === "onboarding") return <ComingSoon nombre={tenant.nombre_negocio} />;
  if (tenant.estado === "suspendido" || tenant.estado === "moroso") {
    return <Mantencion nombre={tenant.nombre_negocio} />;
  }

  const { content, theme } = await getTenantRender(tenant.id);
  // Fallback seguro: si el jsonb es inválido o falta, no caemos con error.
  if (!content) return <Mantencion nombre={tenant.nombre_negocio} />;

  return (
    <>
      <TenantLanding
        content={content}
        nombreNegocio={tenant.nombre_negocio}
        tenantId={tenant.id}
        theme={theme}
        url={`https://${host}`}
      />
      <PageviewBeacon tenantId={tenant.id} />
    </>
  );
}
