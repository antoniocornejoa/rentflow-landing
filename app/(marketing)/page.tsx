import type { Metadata } from "next";
import Link from "next/link";
import { getPlanes } from "@/lib/marketing/planes";
import { formatCLP } from "@/lib/format";
import { Calculator } from "@/components/marketing/calculator";
import { ProspectForm } from "@/components/marketing/prospect-form";

export const metadata: Metadata = {
  title: "RentFlow — Landing pages en arriendo para pymes",
  description:
    "Tu negocio con una página profesional que capta clientes por WhatsApp. Desde $29.900/mes, sin costos de desarrollo. Talca, Chile.",
};

const DEMOS = [
  { slug: "servicios", titulo: "Servicios" },
  { slug: "gastronomia", titulo: "Gastronomía" },
  { slug: "inmobiliaria", titulo: "Inmobiliaria" },
  { slug: "retail", titulo: "Retail" },
];

export default async function MarketingHome() {
  const planes = await getPlanes();

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center">
        <span className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-[var(--muted)]">
          Talca · Chile
        </span>
        <h1 className="text-balance text-4xl font-bold sm:text-5xl">
          Tu negocio, con una landing que <span className="text-[var(--brand)]">capta clientes</span>.
        </h1>
        <p className="max-w-xl text-pretty text-lg text-[var(--muted)]">
          Páginas profesionales en arriendo para pymes: rápidas, mobile-first y listas para recibir contactos
          por WhatsApp. Sin costos de desarrollo.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="#planes" className="rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-white">
            Ver planes
          </a>
          <a href="#contacto" className="rounded-full border border-[var(--brand)] px-6 py-3 font-semibold text-[var(--brand)]">
            Quiero la mía
          </a>
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="bg-[var(--surface)] px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-3xl font-semibold">Planes simples, sin sorpresas</h2>
          <p className="mb-10 text-center text-[var(--muted)]">Un pago mensual. Incluye hosting, actualizaciones y soporte.</p>
          <div className="grid gap-6 md:grid-cols-3">
            {planes.map((p, i) => (
              <div
                key={p.plan}
                className={`flex flex-col gap-4 rounded-2xl border bg-[var(--bg)] p-6 ${i === 1 ? "border-[var(--brand)] shadow-md" : "border-black/10"}`}
              >
                {i === 1 ? (
                  <span className="w-fit rounded-full bg-[var(--brand)] px-3 py-0.5 text-xs font-semibold text-white">
                    Más elegido
                  </span>
                ) : null}
                <h3 className="text-xl font-semibold">{p.nombre}</h3>
                <p className="text-3xl font-bold">
                  {formatCLP(p.precio)}
                  <span className="text-base font-normal text-[var(--muted)]">/mes</span>
                </p>
                {p.descripcion ? <p className="text-sm text-[var(--muted)]">{p.descripcion}</p> : null}
                <ul className="flex flex-col gap-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-[var(--brand)]">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#contacto" className="mt-auto rounded-full bg-[var(--brand)] px-5 py-2.5 text-center font-semibold text-white">
                  Empezar
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demos */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="mb-2 text-center text-3xl font-semibold">Mira cómo se ven</h2>
        <p className="mb-8 text-center text-[var(--muted)]">Cuatro plantillas listas para tu rubro.</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {DEMOS.map((d) => (
            <Link
              key={d.slug}
              href={`/demo/${d.slug}`}
              className="rounded-2xl border border-black/10 p-6 text-center font-medium transition-colors hover:border-[var(--brand)]"
            >
              {d.titulo}
            </Link>
          ))}
        </div>
      </section>

      {/* Calculadora */}
      <section className="bg-[var(--surface)] px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-3xl font-semibold">¿Conviene arrendar?</h2>
          <p className="mb-8 text-center text-[var(--muted)]">Compara una web tradicional con el arriendo.</p>
          <Calculator />
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="mx-auto max-w-2xl px-4 py-16">
        <h2 className="mb-2 text-center text-3xl font-semibold">Parte hoy</h2>
        <p className="mb-8 text-center text-[var(--muted)]">Déjanos tus datos y coordinamos tu landing.</p>
        <ProspectForm />
      </section>

      <footer className="border-t border-black/10 px-4 py-8 text-center text-sm text-[var(--muted)]">
        © 2026 RentFlow · Talca, Chile
      </footer>
    </main>
  );
}
