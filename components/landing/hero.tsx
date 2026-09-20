import type { TenantContent } from "@/lib/content/schema";
import { CtaButton, type CtaContext } from "@/components/landing/cta-button";
import { Img } from "@/components/landing/img";

export function Hero({ hero, ctx }: { hero: TenantContent["hero"]; ctx: CtaContext }) {
  const centro = hero.alineacion !== "izquierda";
  const tieneImagen = Boolean(hero.imagen);

  return (
    <header
      className={`relative overflow-hidden px-4 ${tieneImagen ? "text-white" : "text-[var(--text)]"}`}
    >
      {tieneImagen && hero.imagen ? (
        <>
          <Img
            image={hero.imagen}
            priority
            sizes="100vw"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: hero.overlay ?? 0.45 }}
            aria-hidden
          />
        </>
      ) : null}

      <div
        className={`relative mx-auto flex min-h-[70dvh] max-w-4xl flex-col justify-center gap-5 py-16 ${
          centro ? "items-center text-center" : "items-start text-left"
        }`}
      >
        {hero.eyebrow ? (
          <span className="rounded-full border border-current/25 px-3 py-1 text-xs font-medium tracking-wide">
            {hero.eyebrow}
          </span>
        ) : null}
        <h1 className="text-balance text-4xl font-bold leading-tight sm:text-5xl">{hero.titulo}</h1>
        {hero.subtitulo ? (
          <p className={`text-pretty text-lg sm:text-xl ${tieneImagen ? "text-white/90" : "text-[var(--muted)]"}`}>
            {hero.subtitulo}
          </p>
        ) : null}
        <div className={`mt-2 flex flex-wrap gap-3 ${centro ? "justify-center" : ""}`}>
          <CtaButton cta={hero.cta_primario} ctx={ctx} variant="primario" />
          {hero.cta_secundario ? (
            <CtaButton cta={hero.cta_secundario} ctx={ctx} variant="secundario" />
          ) : null}
        </div>
      </div>
    </header>
  );
}
