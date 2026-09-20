import type { TenantContent } from "@/lib/content/schema";
import { Section } from "@/components/landing/section";
import { Img } from "@/components/landing/img";

type Galeria = NonNullable<TenantContent["galeria"]>;

export function Galeria({ galeria }: { galeria: Galeria }) {
  const cols = galeria.columnas ?? 3;
  const gridCols = cols === 1 ? "sm:grid-cols-1" : cols === 2 ? "sm:grid-cols-2" : cols === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3";

  return (
    <Section id="galeria" titulo={galeria.titulo ?? "Galería"}>
      <div className={`grid grid-cols-2 gap-3 ${gridCols}`}>
        {galeria.imagenes.map((img, i) => (
          <figure key={i} className="overflow-hidden rounded-2xl">
            <Img
              image={img}
              sizes="(max-width: 640px) 50vw, 33vw"
              className="aspect-[4/3] h-full w-full object-cover transition-transform hover:scale-105"
            />
            {img.caption ? (
              <figcaption className="mt-1 text-center text-xs text-[var(--muted)]">{img.caption}</figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </Section>
  );
}
