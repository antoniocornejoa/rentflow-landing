"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { captureTracking } from "@/lib/utm";
import { TurnstileWidget } from "@/components/turnstile";

type Valores = Record<string, string>;

const field = "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 outline-none focus:border-[var(--brand)]";

export function ProspectForm() {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Valores>();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function onSubmit(values: Valores) {
    setError(null);
    if (values.hp) return;
    try {
      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nombre: values.nombre,
          email: values.email,
          telefono: values.telefono,
          empresa: values.empresa,
          plan_interes: values.plan_interes,
          plantilla_interes: values.plantilla_interes,
          mensaje: values.mensaje,
          origen: "sitio-comercial",
          tracking: captureTracking(),
          turnstileToken: turnstileToken ?? undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      reset();
    } catch {
      setError("No pudimos enviar tu mensaje. Intenta de nuevo.");
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 p-6 text-center">
        <p className="font-medium">¡Gracias! Te contactaremos muy pronto.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <input type="text" tabIndex={-1} aria-hidden className="absolute left-[-9999px]" {...register("hp")} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input placeholder="Nombre" required className={field} {...register("nombre", { required: true })} />
        <input placeholder="Empresa (opcional)" className={field} {...register("empresa")} />
        <input placeholder="Email" type="email" className={field} {...register("email")} />
        <input placeholder="Teléfono" type="tel" className={field} {...register("telefono")} />
        <select className={field} defaultValue="" {...register("plan_interes")}>
          <option value="">Plan de interés…</option>
          <option value="basico">Básico</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
        </select>
        <select className={field} defaultValue="" {...register("plantilla_interes")}>
          <option value="">Rubro / plantilla…</option>
          <option value="servicios">Servicios</option>
          <option value="gastronomia">Gastronomía</option>
          <option value="inmobiliaria">Inmobiliaria</option>
          <option value="retail">Retail</option>
        </select>
      </div>
      <textarea placeholder="Cuéntanos de tu negocio (opcional)" rows={3} className={field} {...register("mensaje")} />
      <TurnstileWidget onToken={setTurnstileToken} />
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-white disabled:opacity-60"
      >
        {isSubmitting ? "Enviando…" : "Quiero mi landing"}
      </button>
    </form>
  );
}
