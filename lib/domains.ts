/**
 * Clasificación de hosts para el ruteo multi-tenant.
 * Funciones PURAS (edge-safe): sin acceso a red, entorno ni Node APIs.
 *
 *   {root}            -> "marketing"  (sitio comercial)
 *   www.{root}        -> "marketing"
 *   app.{root}        -> "platform"   (panel admin + portal cliente)
 *   cualquier otro    -> "tenant"     (landing de un cliente)
 */

export type HostKind = "marketing" | "platform" | "tenant";

export interface HostClassification {
  kind: HostKind;
  /** Host normalizado (minúsculas, sin punto final). Clave para resolver el tenant. */
  host: string;
}

/** Normaliza un host: minúsculas y sin punto final. Mantiene el puerto (dev). */
export function normalizeHost(rawHost: string | null | undefined): string {
  if (!rawHost) return "";
  return rawHost.trim().toLowerCase().replace(/\.$/, "");
}

export function classifyHost(
  rawHost: string | null | undefined,
  rootDomain: string,
): HostClassification {
  const host = normalizeHost(rawHost);
  const root = normalizeHost(rootDomain);

  // Host ausente/vacío -> degradar al sitio comercial (evita /sites/ malformado).
  if (host === "") return { kind: "marketing", host };
  if (host === root || host === `www.${root}`) return { kind: "marketing", host };
  if (host === `app.${root}`) return { kind: "platform", host };
  return { kind: "tenant", host };
}
