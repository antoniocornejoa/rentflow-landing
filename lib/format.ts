const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const uf = new Intl.NumberFormat("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 1 });

/** Formatea un monto en pesos chilenos: 29900 -> "$29.900". */
export function formatCLP(monto: number): string {
  return clp.format(monto);
}

/** Formatea un monto con su moneda (CLP o UF). */
export function formatMonto(monto: number, moneda: "CLP" | "UF"): string {
  return moneda === "UF" ? `UF ${uf.format(monto)}` : formatCLP(monto);
}
