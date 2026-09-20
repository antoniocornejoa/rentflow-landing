export const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Primer día (UTC) del mes actual + offset (offset -1 = mes pasado). */
export function primerDiaMes(offset = 0): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
}

export function claveMes(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function etiquetaMes(d: Date): string {
  return `${MESES[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
}

export interface MesBucket {
  clave: string;
  etiqueta: string;
}

/** Los últimos 6 meses (del más antiguo al actual). */
export function ultimos6Meses(): MesBucket[] {
  const out: MesBucket[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = primerDiaMes(-i);
    out.push({ clave: claveMes(d), etiqueta: etiquetaMes(d) });
  }
  return out;
}

/** Clave de mes de una fecha ISO/string. */
export function claveMesDe(iso: string): string {
  const d = new Date(iso);
  return claveMes(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
}
