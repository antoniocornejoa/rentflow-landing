/** 404 neutro para un host que no corresponde a ningún tenant activo. */
export default function SitioNoEncontrado() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold">Sitio no encontrado</h1>
      <p className="text-[var(--muted)]">
        No hay ningún sitio publicado en esta dirección.
      </p>
    </main>
  );
}
