"use client";

import { useActionState } from "react";
import { savePortalBasics } from "@/app/(platform)/panel/portal/actions";
import type { TenantContent } from "@/lib/content/schema";

const field = "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 outline-none focus:border-[var(--brand)]";

export function BasicsForm({ tenantId, content }: { tenantId: string; content: TenantContent }) {
  const [state, action, pending] = useActionState(savePortalBasics, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="tenant_id" value={tenantId} />
      <label className="flex flex-col gap-1 text-sm font-medium">
        Título principal
        <input name="hero_titulo" defaultValue={content.hero.titulo} className={field} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Subtítulo
        <input name="hero_subtitulo" defaultValue={content.hero.subtitulo ?? ""} className={field} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          WhatsApp (+56XXXXXXXXX)
          <input name="whatsapp_numero" defaultValue={content.whatsapp.numero} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Mensaje de WhatsApp
          <input name="whatsapp_mensaje" defaultValue={content.whatsapp.mensaje_prellenado} className={field} />
        </label>
      </div>
      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-emerald-600">Guardado ✓ Tu sitio se actualizó.</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-[var(--brand)] px-5 py-2.5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
