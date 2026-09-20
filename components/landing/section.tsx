import type { ReactNode } from "react";

/** Contenedor de sección con ancho máximo, padding mobile-first y título opcional. */
export function Section({
  id,
  titulo,
  children,
  className,
  surface,
}: {
  id?: string;
  titulo?: string;
  children: ReactNode;
  className?: string;
  surface?: boolean;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-16 px-4 py-14 sm:py-20 ${surface ? "bg-[var(--surface)]" : ""} ${className ?? ""}`}
    >
      <div className="mx-auto w-full max-w-5xl">
        {titulo ? (
          <h2 className="mb-8 text-center text-2xl font-semibold sm:text-3xl">{titulo}</h2>
        ) : null}
        {children}
      </div>
    </section>
  );
}
