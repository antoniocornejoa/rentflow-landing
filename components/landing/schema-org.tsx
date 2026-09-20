import type { TenantContent } from "@/lib/content/schema";
import { toOpeningHours } from "@/lib/content/horarios";
import { storageUrl } from "@/lib/storage";

/** JSON-LD Schema.org LocalBusiness derivado del contenido del tenant. */
export function SchemaOrg({
  content,
  nombreNegocio,
  url,
}: {
  content: TenantContent;
  nombreNegocio: string;
  url?: string;
}) {
  const img = content.seo.og_image ?? content.hero.imagen;
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: nombreNegocio,
    description: content.seo.description,
    telephone: content.whatsapp.numero,
  };
  if (url) jsonLd.url = url;
  if (img) jsonLd.image = /^https?:\/\//.test(img.path) ? img.path : storageUrl(img.path);

  if (content.ubicacion) {
    jsonLd.address = {
      "@type": "PostalAddress",
      streetAddress: content.ubicacion.direccion,
      addressLocality: content.ubicacion.comuna,
      addressRegion: content.ubicacion.region,
      addressCountry: "CL",
    };
    if (content.ubicacion.lat != null && content.ubicacion.lng != null) {
      jsonLd.geo = { "@type": "GeoCoordinates", latitude: content.ubicacion.lat, longitude: content.ubicacion.lng };
    }
  }
  if (content.horarios) {
    const oh = toOpeningHours(content.horarios);
    if (oh.length) jsonLd.openingHoursSpecification = oh;
  }
  if (content.redes) {
    const sameAs = Object.values(content.redes).filter(Boolean);
    if (sameAs.length) jsonLd.sameAs = sameAs;
  }

  return (
    <script
      type="application/ld+json"
      // JSON-LD controlado por nosotros (contenido validado por Zod).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
