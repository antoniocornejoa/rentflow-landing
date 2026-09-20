"use client";

import { useMemo, useState } from "react";
import type { ContenidoInmobiliaria } from "@/lib/content/schema";
import { Section } from "@/components/landing/section";

/** Cotizador referencial de dividendo (amortización francesa). No es oferta. */
export function CotizadorBlock({ cotizador }: { cotizador: NonNullable<ContenidoInmobiliaria["cotizador"]> }) {
  const [valor, setValor] = useState<number>(3000);
  const [piePct, setPiePct] = useState<number>(cotizador.pie_min_pct);
  const [plazo, setPlazo] = useState<number>(cotizador.plazos_anios[0] ?? 25);

  const dividendo = useMemo(() => {
    const financiado = valor * (1 - piePct / 100);
    const r = cotizador.tasa_anual / 100 / 12;
    const n = plazo * 12;
    if (r === 0) return financiado / n;
    return (financiado * r) / (1 - Math.pow(1 + r, -n));
  }, [valor, piePct, plazo, cotizador.tasa_anual]);

  const money = cotizador.moneda;
  const fmt = (x: number) => `${money} ${x.toLocaleString("es-CL", { maximumFractionDigits: 1 })}`;
  const inputCls = "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-[var(--brand)]";

  return (
    <Section id="cotizador" titulo="Cotiza tu dividendo" surface>
      <div className="mx-auto grid max-w-3xl gap-6 rounded-2xl bg-[var(--bg)] p-6 shadow-sm md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Valor de la propiedad ({money})
            <input type="number" min={0} value={valor} onChange={(e) => setValor(Number(e.target.value))} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Pie ({piePct}%)
            <input type="range" min={cotizador.pie_min_pct} max={40} value={piePct} onChange={(e) => setPiePct(Number(e.target.value))} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Plazo
            <select value={plazo} onChange={(e) => setPlazo(Number(e.target.value))} className={inputCls}>
              {cotizador.plazos_anios.map((p) => (
                <option key={p} value={p}>
                  {p} años
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-[var(--brand)]/5 p-6 text-center">
          <span className="text-sm text-[var(--muted)]">Dividendo estimado</span>
          <span className="text-3xl font-bold text-[var(--brand)]">{fmt(dividendo)}</span>
          <span className="text-xs text-[var(--muted)]">al mes · tasa {cotizador.tasa_anual}% anual</span>
        </div>
      </div>
      <p className="mx-auto mt-4 max-w-3xl text-center text-xs text-[var(--muted)]">{cotizador.nota_legal}</p>
    </Section>
  );
}
