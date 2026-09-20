import type { TenantContent } from "@/lib/content/schema";
import { Section } from "@/components/landing/section";

type Testimonios = NonNullable<TenantContent["testimonios"]>;

function Estrellas({ n }: { n: number }) {
  return (
    <div className="text-amber-500" aria-label={`${n} de 5 estrellas`}>
      {"★".repeat(n)}
      <span className="text-slate-300">{"★".repeat(5 - n)}</span>
    </div>
  );
}

export function Testimonios({ testimonios }: { testimonios: Testimonios }) {
  return (
    <Section titulo={testimonios.titulo ?? "Lo que dicen nuestros clientes"} surface>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {testimonios.items.map((t, i) => (
          <blockquote key={i} className="flex flex-col gap-3 rounded-2xl bg-[var(--bg)] p-6 shadow-sm">
            {typeof t.rating === "number" ? <Estrellas n={t.rating} /> : null}
            <p className="text-pretty text-slate-700">“{t.texto}”</p>
            <footer className="mt-auto text-sm font-medium">
              {t.autor}
              {t.rol ? <span className="font-normal text-[var(--muted)]"> · {t.rol}</span> : null}
            </footer>
          </blockquote>
        ))}
      </div>
    </Section>
  );
}
