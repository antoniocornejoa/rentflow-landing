"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setSent(true);
    } catch {
      setError("No pudimos enviar el enlace. Verifica el correo e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">RentFlow</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Panel y portal de clientes</p>
      </div>

      {sent ? (
        <div className="rounded-2xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 p-6 text-center">
          <p className="font-medium">Revisa tu correo ✉️</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Te enviamos un enlace mágico para entrar. Ábrelo en este dispositivo.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label htmlFor="email" className="text-sm font-medium">
            Tu correo
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@dominio.cl"
            className="rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--brand)]"
          />
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Enviando…" : "Enviar enlace mágico"}
          </button>
        </form>
      )}
    </main>
  );
}
