import type { ContenidoServicios } from "@/lib/content/schema";
import { Section } from "@/components/landing/section";
import { Img } from "@/components/landing/img";
import { formatCLP } from "@/lib/format";

export function ServiciosBlock({ servicios }: { servicios: ContenidoServicios["servicios"] }) {
  return (
    <Section id="servicios" titulo={servicios.titulo ?? "Servicios"}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {servicios.items.map((s, i) => (
          <article key={i} className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-[var(--bg)] p-6 shadow-sm">
            {s.imagen ? (
              <Img image={s.imagen} sizes="(max-width:640px) 100vw, 33vw" className="aspect-video w-full rounded-xl object-cover" />
            ) : null}
            <h3 className="text-lg font-semibold">{s.nombre}</h3>
            {s.descripcion ? <p className="text-sm text-[var(--muted)]">{s.descripcion}</p> : null}
            {typeof s.precio_desde === "number" ? (
              <p className="mt-auto text-sm font-medium text-[var(--brand)]">Desde {formatCLP(s.precio_desde)}</p>
            ) : null}
          </article>
        ))}
      </div>
    </Section>
  );
}
