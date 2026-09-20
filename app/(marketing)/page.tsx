import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RentFlow — Landing pages en arriendo para pymes",
  description:
    "Tu negocio con una página profesional que capta clientes por WhatsApp. Desde $29.900/mes, sin costos de desarrollo.",
};

/**
 * Sitio comercial (midominio.cl). Placeholder de Fase 1.
 * La versión completa (planes, demos, calculadora, formulario) es la Fase 6.
 */
export default function MarketingHome() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <span className="rounded-full border border-current/15 px-3 py-1 text-xs font-medium tracking-wide text-[var(--muted)]">
        Talca · Chile
      </span>
      <h1 className="text-balance text-4xl font-semibold sm:text-5xl">
        Tu negocio, con una landing que{" "}
        <span className="text-[var(--brand)]">capta clientes</span>.
      </h1>
      <p className="text-pretty max-w-xl text-lg text-[var(--muted)]">
        Páginas profesionales en arriendo para pymes: rápidas, mobile-first y
        listas para recibir contactos por WhatsApp. Desde $29.900 al mes.
      </p>
      <p className="text-sm text-[var(--muted)]">
        Plataforma en construcción — el sitio comercial completo llega en la
        Fase 6.
      </p>
    </main>
  );
}
