import type { ContenidoInmobiliaria } from "@/lib/content/schema";
import { Section } from "@/components/landing/section";
import { Img } from "@/components/landing/img";
import { formatMonto } from "@/lib/format";

const DISPO_LABEL: Record<string, string> = {
  disponible: "Disponible",
  pocas_unidades: "Pocas unidades",
  agotado: "Agotado",
};

export function TipologiasBlock({ tipologias }: { tipologias: ContenidoInmobiliaria["tipologias"] }) {
  return (
    <Section id="tipologias" titulo={tipologias.titulo ?? "Tipologías"}>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tipologias.items.map((t, i) => (
          <article key={i} className="flex flex-col gap-3 overflow-hidden rounded-2xl border border-black/5 bg-[var(--bg)] shadow-sm">
            {t.plano ? (
              <Img image={t.plano} sizes="(max-width:640px) 100vw, 33vw" className="aspect-[4/3] w-full bg-white object-contain" />
            ) : null}
            <div className="flex flex-col gap-2 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t.nombre}</h3>
                <span className="rounded-full bg-[var(--brand)]/10 px-2 py-0.5 text-xs text-[var(--brand)]">
                  {DISPO_LABEL[t.disponibilidad] ?? t.disponibilidad}
                </span>
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
                <li>{t.dormitorios} dorm.</li>
                {typeof t.banos === "number" ? <li>{t.banos} baños</li> : null}
                {typeof t.m2_utiles === "number" ? <li>{t.m2_utiles} m² útiles</li> : null}
                {typeof t.m2_totales === "number" ? <li>{t.m2_totales} m² totales</li> : null}
              </ul>
              <p className="mt-1 font-semibold text-[var(--brand)]">Desde {formatMonto(t.precio_desde, t.moneda)}</p>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
