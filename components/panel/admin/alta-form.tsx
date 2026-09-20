"use client";

import { useActionState, useState } from "react";
import { createTenant, type AltaState } from "@/app/(platform)/panel/tenants/actions";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

const field = "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 outline-none focus:border-[var(--brand)]";

export function AltaForm({ rootDomain }: { rootDomain: string }) {
  const [state, formAction, pending] = useActionState<AltaState, FormData>(createTenant, {});
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Nombre del negocio
        <input
          name="nombre_negocio"
          required
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            if (!slug) setSlug(slugify(e.target.value));
          }}
          className={field}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Slug (subdominio)
        <input name="slug" required value={slug} onChange={(e) => setSlug(slugify(e.target.value))} className={field} />
        <span className="text-xs text-[var(--muted)]">
          Sitio inicial: <strong>{slug || "tu-negocio"}.{rootDomain}</strong>
        </span>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Plantilla
          <select name="plantilla" className={field} defaultValue="servicios">
            <option value="servicios">Servicios</option>
            <option value="gastronomia">Gastronomía</option>
            <option value="inmobiliaria">Inmobiliaria</option>
            <option value="retail">Retail</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Plan
          <select name="plan" className={field} defaultValue="basico">
            <option value="basico">Básico</option>
            <option value="pro">Pro</option>
            <option value="premium">Premium</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Monto mensual (CLP)
          <input name="monto" type="number" min={0} required defaultValue={29900} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Día de cobro (1–28)
          <input name="dia_cobro" type="number" min={1} max={28} required defaultValue={5} className={field} />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Correo del dueño (accede al portal)
        <input name="owner_email" type="email" required className={field} />
      </label>

      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Creando…" : "Crear cliente"}
      </button>
    </form>
  );
}
