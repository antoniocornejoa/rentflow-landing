import type { TenantContent } from "@/lib/content/schema";
import { DIAS_ORDEN, DIA_LABEL, tramosTexto } from "@/lib/content/horarios";

type Redes = NonNullable<TenantContent["redes"]>;
type Horarios = NonNullable<TenantContent["horarios"]>;
type Ubicacion = NonNullable<TenantContent["ubicacion"]>;

const RED_LABEL: Record<keyof Redes, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  sitio_web: "Sitio web",
};

export function Footer({
  nombre,
  horarios,
  redes,
  ubicacion,
}: {
  nombre: string;
  horarios?: Horarios;
  redes?: Redes;
  ubicacion?: Ubicacion;
}) {
  const anio = "2026";
  const items = horarios
    ? [...horarios.items].sort((a, b) => DIAS_ORDEN.indexOf(a.dia) - DIAS_ORDEN.indexOf(b.dia))
    : [];
  const redesEntries = redes
    ? (Object.entries(redes) as [keyof Redes, string][]).filter(([, v]) => Boolean(v))
    : [];

  return (
    <footer className="bg-[var(--text)] px-4 py-12 text-white/85">
      <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{nombre}</h3>
          {ubicacion ? (
            <p className="mt-2 text-sm">
              {ubicacion.direccion}
              <br />
              {ubicacion.comuna}, {ubicacion.region}
            </p>
          ) : null}
        </div>

        {items.length ? (
          <div>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/60">Horarios</h4>
            <ul className="space-y-1 text-sm">
              {items.map((item) => (
                <li key={item.dia} className="flex justify-between gap-4">
                  <span>{DIA_LABEL[item.dia]}</span>
                  <span className="text-white/70">{tramosTexto(item)}</span>
                </li>
              ))}
            </ul>
            {horarios?.nota ? <p className="mt-2 text-xs text-white/50">{horarios.nota}</p> : null}
          </div>
        ) : null}

        {redesEntries.length ? (
          <div>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/60">Síguenos</h4>
            <ul className="space-y-1 text-sm">
              {redesEntries.map(([red, url]) => (
                <li key={red}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    {RED_LABEL[red]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="mx-auto mt-10 max-w-5xl border-t border-white/10 pt-6 text-center text-xs text-white/50">
        © {anio} {nombre}. Sitio por RentFlow.
      </div>
    </footer>
  );
}
