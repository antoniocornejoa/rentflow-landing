"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import type { CampoFormulario } from "@/lib/content/schema";
import { captureTracking } from "@/lib/utm";
import { TurnstileWidget } from "@/components/turnstile";

const KNOWN_KEYS = ["nombre", "telefono", "email", "mensaje"] as const;

type Valores = Record<string, string | boolean>;

export function ContactForm({
  tenantId,
  campos,
  botonTexto,
  mensajeExito,
  consentimiento,
  demo = false,
  extra,
}: {
  tenantId?: string;
  campos: CampoFormulario[];
  botonTexto: string;
  mensajeExito: string;
  consentimiento: boolean;
  demo?: boolean;
  /** Campos ocultos extra (p. ej. tipología para inmobiliaria). */
  extra?: Record<string, string>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Valores>();
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function onSubmit(values: Valores) {
    setError(null);
    if (values.hp) return; // honeypot: bot

    const nombre = typeof values.nombre === "string" ? values.nombre : undefined;
    const telefono = typeof values.telefono === "string" ? values.telefono : undefined;
    const email = typeof values.email === "string" ? values.email : undefined;
    const mensaje = typeof values.mensaje === "string" ? values.mensaje : undefined;
    const metadata: Record<string, unknown> = { ...extra };
    for (const [k, v] of Object.entries(values)) {
      if (!KNOWN_KEYS.includes(k as (typeof KNOWN_KEYS)[number]) && k !== "hp") metadata[k] = v;
    }

    if (demo || !tenantId) {
      setEnviado(true);
      reset();
      return;
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          origen: "formulario",
          nombre,
          telefono,
          email,
          mensaje,
          metadata,
          tracking: captureTracking(),
          turnstileToken: turnstileToken ?? undefined,
        }),
      });
      if (!res.ok) throw new Error("fallo");
      setEnviado(true);
      reset();
    } catch {
      setError("No pudimos enviar tu mensaje. Intenta de nuevo o escríbenos por WhatsApp.");
    }
  }

  if (enviado) {
    return (
      <div className="rounded-2xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 p-6 text-center">
        <p className="text-lg font-medium">{mensajeExito}</p>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-[var(--brand)]";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {/* Honeypot anti-spam (oculto para humanos). */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute left-[-9999px] h-0 w-0"
        {...register("hp")}
      />

      {campos.map((campo) => (
        <div key={campo.nombre} className="flex flex-col gap-1.5">
          <label htmlFor={`f-${campo.nombre}`} className="text-sm font-medium text-slate-700">
            {campo.etiqueta}
            {campo.requerido ? <span className="text-red-500"> *</span> : null}
          </label>

          {campo.tipo === "textarea" ? (
            <textarea
              id={`f-${campo.nombre}`}
              rows={4}
              placeholder={campo.placeholder}
              className={inputCls}
              {...register(campo.nombre, { required: campo.requerido })}
            />
          ) : campo.tipo === "select" ? (
            <select id={`f-${campo.nombre}`} className={inputCls} {...register(campo.nombre, { required: campo.requerido })}>
              <option value="">Selecciona…</option>
              {(campo.opciones ?? []).map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          ) : campo.tipo === "checkbox" ? (
            <input id={`f-${campo.nombre}`} type="checkbox" className="h-5 w-5" {...register(campo.nombre, { required: campo.requerido })} />
          ) : (
            <input
              id={`f-${campo.nombre}`}
              type={campo.tipo === "email" ? "email" : campo.tipo === "telefono" ? "tel" : "text"}
              placeholder={campo.placeholder}
              className={inputCls}
              {...register(campo.nombre, { required: campo.requerido })}
            />
          )}

          {errors[campo.nombre] ? (
            <span className="text-sm text-red-500">Este campo es obligatorio</span>
          ) : null}
        </div>
      ))}

      {consentimiento ? (
        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input type="checkbox" required className="mt-1 h-4 w-4" {...register("consentimiento", { required: true })} />
          <span>Autorizo el uso de mis datos para ser contactado (Ley 19.628).</span>
        </label>
      ) : null}

      <TurnstileWidget onToken={setTurnstileToken} />

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-[var(--brand)] px-6 py-3 text-base font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {isSubmitting ? "Enviando…" : botonTexto}
      </button>
    </form>
  );
}
