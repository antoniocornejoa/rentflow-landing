const ESTADO_STYLE: Record<string, string> = {
  activo: "bg-emerald-100 text-emerald-800",
  onboarding: "bg-sky-100 text-sky-800",
  moroso: "bg-amber-100 text-amber-800",
  suspendido: "bg-red-100 text-red-800",
  cancelado: "bg-slate-200 text-slate-700",
  al_dia: "bg-emerald-100 text-emerald-800",
  pendiente: "bg-amber-100 text-amber-800",
  vencido: "bg-red-100 text-red-800",
};

const ESTADO_LABEL: Record<string, string> = {
  activo: "Activo",
  onboarding: "Onboarding",
  moroso: "Moroso",
  suspendido: "Suspendido",
  cancelado: "Cancelado",
  al_dia: "Al día",
  pendiente: "Pendiente",
  vencido: "Vencido",
};

export function Badge({ value }: { value: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_STYLE[value] ?? "bg-slate-100 text-slate-700"}`}>
      {ESTADO_LABEL[value] ?? value}
    </span>
  );
}
