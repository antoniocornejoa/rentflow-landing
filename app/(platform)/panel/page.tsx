import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};

/**
 * Entrada de app.midominio.cl (panel admin + portal cliente).
 * Placeholder de Fase 1. El panel (Fase 4) y el portal (Fase 5) se construyen
 * sobre esta rama tras el login por magic link.
 */
export default function PanelHome() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold">Panel RentFlow</h1>
      <p className="text-[var(--muted)]">
        Aquí vivirán el panel de administración (Fase 4) y el portal del cliente
        (Fase 5). Acceso por enlace mágico (magic link).
      </p>
    </main>
  );
}
