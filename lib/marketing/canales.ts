/** Canales de publicidad soportados. Módulo plano: se puede importar tanto en
 *  Server Components / actions como en Client Components. */
export const CANALES = ["google", "instagram", "facebook", "tiktok", "otro"] as const;

export type Canal = (typeof CANALES)[number];

export const CANAL_LABEL: Record<string, string> = {
  google: "Google Ads",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  otro: "Otro",
};
