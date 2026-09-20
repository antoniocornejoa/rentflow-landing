"use client";

import { useActionState } from "react";
import { createChangeRequest } from "@/app/(platform)/panel/portal/actions";

const field = "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 outline-none focus:border-[var(--brand)]";

export function ChangeRequestForm({ tenantId }: { tenantId: string }) {
  const [state, action, pending] = useActionState(createChangeRequest, {});

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 p-6">
        <p className="font-medium">¡Solicitud enviada! ✓</p>
        <p className="mt-1 text-sm text-[var(--muted)]">Te contactaremos para coordinar el cambio.</p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="tenant_id" value={tenantId} />
      <label className="flex flex-col gap-1 text-sm font-medium">
        Tipo de cambio
        <select name="tipo" className={field} defaultValue="contenido">
          <option value="contenido">Contenido</option>
          <option value="diseno">Diseño</option>
          <option value="funcionalidad">Funcionalidad</option>
          <option value="otro">Otro</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Título
        <input name="titulo" required className={field} placeholder="Ej: Agregar sección de promociones" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Descripción
        <textarea name="descripcion" required rows={4} className={field} placeholder="Cuéntanos qué necesitas cambiar." />
      </label>
      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-[var(--brand)] px-5 py-2.5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar solicitud"}
      </button>
    </form>
  );
}
