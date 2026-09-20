import type { TenantContent } from "@/lib/content/schema";
import { Section } from "@/components/landing/section";

type Ubicacion = NonNullable<TenantContent["ubicacion"]>;

export function UbicacionBlock({ ubicacion }: { ubicacion: Ubicacion }) {
  const query =
    ubicacion.lat != null && ubicacion.lng != null
      ? `${ubicacion.lat},${ubicacion.lng}`
      : `${ubicacion.direccion}, ${ubicacion.comuna}, ${ubicacion.region}`;
  const embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  const linkHref = ubicacion.google_maps_url ?? `https://www.google.com/maps?q=${encodeURIComponent(query)}`;

  return (
    <Section id="ubicacion" titulo="Dónde encontrarnos">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col justify-center gap-3">
          <p className="text-lg font-medium">{ubicacion.direccion}</p>
          <p className="text-[var(--muted)]">
            {ubicacion.comuna}, {ubicacion.region}
          </p>
          <a
            href={linkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit rounded-full border border-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-[var(--brand)]"
          >
            Cómo llegar
          </a>
        </div>
        {ubicacion.mostrar_mapa ? (
          <iframe
            title={`Mapa de ${ubicacion.direccion}`}
            src={embedSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="aspect-video w-full rounded-2xl border-0"
          />
        ) : null}
      </div>
    </Section>
  );
}
