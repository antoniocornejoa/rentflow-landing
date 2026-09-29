"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addSpend, type SpendState } from "@/app/(platform)/panel/publicidad/actions";
import { CANALES, CANAL_LABEL } from "@/lib/marketing/canales";

const field = "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 outline-none focus:border-[var(--brand)]";

export function SpendForm() {
  const [state, formAction, pending] = useActionState<SpendState, FormData>(addSpend, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [hoy] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Fecha
        <input name="fecha" type="date" required defaultValue={hoy} className={field} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Canal
        <select name="canal" defaultValue="google" className={field}>
          {CANALES.map((c) => (
            <option key={c} value={c}>
              {CANAL_LABEL[c]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Campaña (opcional)
        <input name="campana" placeholder="Ej: Lanzamiento septiembre" className={field} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Monto (CLP)
        <input name="monto" type="number" min={0} required placeholder="50000" className={field} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
        Notas (opcional)
        <input name="notas" placeholder="Detalle de la campaña, objetivo, etc." className={field} />
      </label>

      {state.error ? <p className="text-sm text-red-500 sm:col-span-2">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-emerald-600 sm:col-span-2">Gasto registrado ✓</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="justify-self-start rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-white disabled:opacity-60 sm:col-span-2"
      >
        {pending ? "Guardando…" : "Registrar gasto"}
      </button>
    </form>
  );
}
