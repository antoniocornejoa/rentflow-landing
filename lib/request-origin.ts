/**
 * Host de origen de la request (cabecera Origin, o Referer como respaldo).
 * Se usa para acotar la ingesta pública al dominio del propio tenant.
 */
export function getOriginHost(req: Request): string | null {
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host.toLowerCase();
    } catch {
      /* ignore */
    }
  }
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host.toLowerCase();
    } catch {
      /* ignore */
    }
  }
  return null;
}

/**
 * ¿El origen de la request corresponde a alguno de los hosts permitidos?
 * Lenient: si no hay cabecera de origen, no bloquea (evita falsos negativos);
 * si la hay y no coincide, es un intento cruzado -> bloquear.
 */
export function originAllowed(req: Request, allowedHosts: string[]): boolean {
  const host = getOriginHost(req);
  if (!host) return true;
  return allowedHosts.some((h) => h.toLowerCase() === host);
}
