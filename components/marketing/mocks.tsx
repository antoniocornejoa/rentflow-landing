import { getSampleContent } from "@/lib/content/samples";
import type { Plantilla } from "@/lib/content/schema";
import { formatCLP } from "@/lib/format";
import { Whatsapp, Search } from "@/components/marketing/icons";

interface PreviewLine {
  label: string;
  sub?: string;
}

/** Extrae título + 3 ítems reales del contenido de ejemplo de una plantilla. */
function preview(plantilla: Plantilla): { titulo: string; lineas: PreviewLine[] } {
  const c = getSampleContent(plantilla);
  if (!c) return { titulo: "Tu negocio", lineas: [] };
  const titulo = c.hero.titulo;

  if (c.plantilla === "servicios") {
    return {
      titulo,
      lineas: c.servicios.items.slice(0, 3).map((i) => ({
        label: i.nombre,
        sub: typeof i.precio_desde === "number" ? `Desde ${formatCLP(i.precio_desde)}` : undefined,
      })),
    };
  }
  if (c.plantilla === "gastronomia") {
    const items = c.menu.categorias[0]?.items ?? [];
    return { titulo, lineas: items.slice(0, 3).map((i) => ({ label: i.nombre, sub: formatCLP(i.precio) })) };
  }
  if (c.plantilla === "inmobiliaria") {
    return {
      titulo,
      lineas: c.tipologias.items.slice(0, 3).map((i) => ({
        label: i.nombre,
        sub: `${i.dormitorios}D · desde ${i.moneda} ${i.precio_desde}`,
      })),
    };
  }
  const items = c.catalogo.categorias[0]?.items ?? [];
  return {
    titulo,
    lineas: items.slice(0, 3).map((i) => ({
      label: i.nombre,
      sub: typeof i.precio === "number" ? formatCLP(i.precio) : undefined,
    })),
  };
}

/** Maqueta de teléfono (CSS/SVG) con una miniatura de la landing del rubro. */
export function PhoneMock({ plantilla }: { plantilla: Plantilla }) {
  const { titulo, lineas } = preview(plantilla);
  return (
    <div className="mx-auto w-[260px] rounded-[2.2rem] border border-black/10 bg-slate-900 p-2 shadow-2xl">
      <div className="relative overflow-hidden rounded-[1.7rem] bg-white">
        {/* notch */}
        <div className="absolute left-1/2 top-1.5 h-4 w-20 -translate-x-1/2 rounded-full bg-slate-900/90" />
        {/* barra superior */}
        <div className="h-11 bg-gradient-to-r from-[#0f766e] to-[#10b981]" />
        <div className="space-y-3 p-4 pt-3 text-slate-900">
          <p className="text-sm font-semibold leading-tight">{titulo}</p>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#25d366] px-3 py-1.5 text-xs font-semibold text-white">
            <Whatsapp width={13} height={13} /> Escríbenos
          </div>
          <div className="space-y-2 pt-1">
            {lineas.map((l, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                <span className="text-[11px] font-medium text-slate-700">{l.label}</span>
                {l.sub ? <span className="text-[10px] tabular-nums text-[#0f766e]">{l.sub}</span> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Maqueta de navegador (para la vitrina de plantillas). */
export function BrowserMock({ plantilla }: { plantilla: Plantilla }) {
  const { titulo, lineas } = preview(plantilla);
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="ml-2 flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] text-slate-400 ring-1 ring-slate-200">
          <Search width={10} height={10} /> tunegocio.cl
        </span>
      </div>
      <div className="space-y-2 p-4 text-slate-900">
        <div className="h-14 rounded-lg bg-gradient-to-r from-[#0f766e] to-[#10b981]" />
        <p className="text-sm font-semibold">{titulo}</p>
        <div className="grid grid-cols-3 gap-2">
          {lineas.slice(0, 3).map((l, i) => (
            <div key={i} className="rounded-md border border-slate-100 bg-slate-50 px-2 py-2 text-[10px] font-medium text-slate-600">
              {l.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
