"use client";

import { useMemo, useState } from "react";
import { formatCLP } from "@/lib/format";

/** Calculadora comparativa: web tradicional (pago único) vs arriendo mensual. */
export function Calculator() {
  const [tradicional, setTradicional] = useState(500000);
  const [mensual, setMensual] = useState(29900);
  const [meses, setMeses] = useState(12);

  const { arriendoAcum, mesesIguala } = useMemo(() => {
    return {
      arriendoAcum: mensual * meses,
      mesesIguala: mensual > 0 ? Math.ceil(tradicional / mensual) : 0,
    };
  }, [tradicional, mensual, meses]);

  const inputCls = "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 outline-none focus:border-[var(--brand)]";

  return (
    <div className="grid gap-6 rounded-2xl border border-black/10 bg-white p-6 md:grid-cols-2">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Web tradicional (pago único)
          <input type="number" min={0} value={tradicional} onChange={(e) => setTradicional(Number(e.target.value))} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Arriendo mensual
          <input type="number" min={0} value={mensual} onChange={(e) => setMensual(Number(e.target.value))} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Horizonte: {meses} meses
          <input type="range" min={1} max={36} value={meses} onChange={(e) => setMeses(Number(e.target.value))} />
        </label>
      </div>
      <div className="flex flex-col justify-center gap-3 rounded-2xl bg-slate-50 p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--muted)]">Web tradicional</span>
          <span className="font-semibold">{formatCLP(tradicional)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--muted)]">Arriendo · {meses} meses</span>
          <span className="font-semibold text-[var(--brand)]">{formatCLP(arriendoAcum)}</span>
        </div>
        <hr className="border-black/10" />
        <p className="text-sm text-slate-700">
          Con el arriendo empiezas hoy sin desembolsar {formatCLP(tradicional)}. Recién al mes{" "}
          <strong>{mesesIguala}</strong> igualarías ese pago único — y en el arriendo va incluido hosting,
          actualizaciones y soporte.
        </p>
      </div>
    </div>
  );
}
