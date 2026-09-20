/** Página neutra "muy pronto" para tenants en onboarding (pre-lanzamiento). */
export function ComingSoon({ nombre }: { nombre: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand)]/10 text-2xl"
        aria-hidden
      >
        🚀
      </div>
      <h1 className="text-3xl font-semibold">{nombre}</h1>
      <p className="text-lg text-[var(--muted)]">
        Muy pronto en línea. Estamos preparando el sitio.
      </p>
    </main>
  );
}
