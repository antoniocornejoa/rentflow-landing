"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

type Modo = "password" | "magic";

export default function LoginPage() {
  const [modo, setModo] = useState<Modo>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Recarga completa para que el servidor tome la sesión (cookies) y rutee al panel.
      window.location.assign("/");
    } catch {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
    }
  }

  async function onMagic(e: React.FormEvent) {
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

  const field =
    "rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--brand)]";

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
      ) : modo === "password" ? (
        <form onSubmit={onPassword} className="flex flex-col gap-3">
          <label htmlFor="email" className="text-sm font-medium">Tu correo</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@dominio.cl" className={field} />
          <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={field} />
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <button type="submit" disabled={loading} className="rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-white disabled:opacity-60">
            {loading ? "Entrando…" : "Entrar"}
          </button>
          <button type="button" onClick={() => { setModo("magic"); setError(null); }} className="text-sm text-[var(--muted)] underline underline-offset-2">
            Prefiero un enlace mágico por correo
          </button>
        </form>
      ) : (
        <form onSubmit={onMagic} className="flex flex-col gap-3">
          <label htmlFor="email" className="text-sm font-medium">Tu correo</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@dominio.cl" className={field} />
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <button type="submit" disabled={loading} className="rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-white disabled:opacity-60">
            {loading ? "Enviando…" : "Enviar enlace mágico"}
          </button>
          <button type="button" onClick={() => { setModo("password"); setError(null); }} className="text-sm text-[var(--muted)] underline underline-offset-2">
            Entrar con correo y contraseña
          </button>
        </form>
      )}
    </main>
  );
}
