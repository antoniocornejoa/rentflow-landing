import { z } from "zod";

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export type UtmKey = (typeof UTM_KEYS)[number];

export const zTracking = z
  .object({
    utm_source: z.string().max(200).optional(),
    utm_medium: z.string().max(200).optional(),
    utm_campaign: z.string().max(200).optional(),
    utm_term: z.string().max(200).optional(),
    utm_content: z.string().max(200).optional(),
    referrer: z.string().max(500).optional(),
    path: z.string().max(500).optional(),
  })
  .strict();

export type Tracking = z.infer<typeof zTracking>;

/** Extrae los parámetros UTM de un query string. Función pura. */
export function parseUtm(params: URLSearchParams): Partial<Record<UtmKey, string>> {
  const out: Partial<Record<UtmKey, string>> = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) out[key] = value.slice(0, 200);
  }
  return out;
}

/** Captura UTM + referrer + path desde el navegador (uso en client components). */
export function captureTracking(): Tracking {
  if (typeof window === "undefined") return {};
  const utm = parseUtm(new URLSearchParams(window.location.search));
  return {
    ...utm,
    referrer: document.referrer ? document.referrer.slice(0, 500) : undefined,
    path: window.location.pathname.slice(0, 500),
  };
}

/** Deriva el tipo de dispositivo desde el User-Agent (server-side, sin cookies). */
export function deviceFromUserAgent(ua: string | null): "mobile" | "tablet" | "desktop" {
  if (!ua) return "desktop";
  const s = ua.toLowerCase();
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(s)) return "tablet";
  if (/mobi|iphone|ipod|android.*mobile|windows phone/.test(s)) return "mobile";
  return "desktop";
}
