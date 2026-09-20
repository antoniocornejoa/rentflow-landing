import type { TenantContent } from "@/lib/content/schema";
import { Section } from "@/components/landing/section";
import { Img } from "@/components/landing/img";

type Confianza = NonNullable<TenantContent["confianza"]>;

export function Confianza({ confianza }: { confianza: Confianza }) {
  return (
    <Section titulo={confianza.titulo} surface>
      {confianza.variante === "logos" && confianza.logos?.length ? (
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-80">
          {confianza.logos.map((logo, i) => (
            <Img key={i} image={logo} sizes="120px" className="h-10 w-auto object-contain" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {confianza.items.map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-1 text-center">
              <span className="text-3xl font-bold text-[var(--brand)]">{item.valor}</span>
              <span className="text-sm text-[var(--muted)]">{item.etiqueta}</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
