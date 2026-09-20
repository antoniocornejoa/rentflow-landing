import "server-only";
import { Resend } from "resend";

let client: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client ??= new Resend(key);
  return client;
}

export interface EmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Envía un correo vía Resend. Best-effort: si no hay API key o falla, devuelve
 * { sent:false } sin lanzar (nunca romper el flujo por un email).
 */
export async function sendEmail({ to, subject, html, replyTo }: EmailParams): Promise<{ sent: boolean; id?: string }> {
  const resend = getResend();
  if (!resend) return { sent: false };
  const from = process.env.RESEND_FROM ?? "RentFlow <onboarding@resend.dev>";
  try {
    const { data, error } = await resend.emails.send({ from, to, subject, html, replyTo });
    if (error) return { sent: false };
    return { sent: true, id: data?.id };
  } catch {
    return { sent: false };
  }
}

/** Escapa texto para interpolarlo con seguridad dentro de HTML de correo. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
