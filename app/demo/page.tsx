import type { Metadata } from "next";
import Link from "next/link";
import { PLANTILLAS } from "@/lib/content/samples";

export const metadata: Metadata = {
  title: "Demos de plantillas",
  robots: { index: false, follow: false },
};

const INFO: Record<string, { titulo: string; desc: string }> = {
  servicios: { titulo: "Servicios", desc: "Taller, clínica, gimnasio, profesional." },
  gastronomia: { titulo: "Gastronomía", desc: "Restaurante o café con carta y pedidos por WhatsApp." },
  inmobiliaria: { titulo: "Inmobiliaria", desc: "Proyecto con tipologías, cotizador y formulario a corredora." },
  retail: { titulo: "Retail", desc: "Tienda con catálogo y consulta por WhatsApp." },
};

export default function DemoIndex() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Demos navegables</h1>
      <p className="mt-2 text-[var(--muted)]">Las 4 plantillas alimentadas por el mismo motor de contenido.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {PLANTILLAS.map((p) => (
          <Link
            key={p}
            href={`/demo/${p}`}
            className="rounded-2xl border border-black/10 p-6 transition-colors hover:border-[var(--brand)]"
          >
            <h2 className="text-lg font-semibold">{INFO[p]?.titulo ?? p}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{INFO[p]?.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
