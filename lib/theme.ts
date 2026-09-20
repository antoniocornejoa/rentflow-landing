import type { CSSProperties } from "react";

/** Tema de un tenant (jsonb tenant_theme.colores / .tipografia). Todo opcional. */
export interface TenantTheme {
  colores?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    bg?: string;
    surface?: string;
    text?: string;
    muted?: string;
  };
  tipografia?: {
    heading?: string;
    body?: string;
  };
}

const DEFAULTS = {
  primary: "#0f766e",
  bg: "#ffffff",
  surface: "#f8fafc",
  text: "#0f172a",
  muted: "#64748b",
};

/** Convierte el tema en variables CSS aplicables al contenedor de la landing. */
export function themeToCssVars(theme: TenantTheme | null | undefined): CSSProperties {
  const c = theme?.colores ?? {};
  const vars: Record<string, string> = {
    "--brand": c.primary ?? DEFAULTS.primary,
    "--brand-secondary": c.secondary ?? c.primary ?? DEFAULTS.primary,
    "--brand-accent": c.accent ?? c.primary ?? DEFAULTS.primary,
    "--bg": c.bg ?? DEFAULTS.bg,
    "--surface": c.surface ?? DEFAULTS.surface,
    "--text": c.text ?? DEFAULTS.text,
    "--muted": c.muted ?? DEFAULTS.muted,
  };
  const font = theme?.tipografia;
  if (font?.body) vars["--font-body"] = font.body;
  if (font?.heading) vars["--font-heading"] = font.heading;
  return vars as CSSProperties;
}
