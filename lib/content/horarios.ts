import type { TenantContent } from "@/lib/content/schema";

export const DIAS_ORDEN = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"] as const;

export const DIA_LABEL: Record<string, string> = {
  lun: "Lunes",
  mar: "Martes",
  mie: "Miércoles",
  jue: "Jueves",
  vie: "Viernes",
  sab: "Sábado",
  dom: "Domingo",
};

const DIA_SCHEMA_ORG: Record<string, string> = {
  lun: "Monday",
  mar: "Tuesday",
  mie: "Wednesday",
  jue: "Thursday",
  vie: "Friday",
  sab: "Saturday",
  dom: "Sunday",
};

type Horarios = NonNullable<TenantContent["horarios"]>;
type HorarioItem = Horarios["items"][number];

/** Texto legible de los tramos de un día (o "Cerrado"). */
export function tramosTexto(item: HorarioItem): string {
  if (item.cerrado || item.tramos.length === 0) return "Cerrado";
  return item.tramos.map((t) => `${t.desde}–${t.hasta}`).join(", ");
}

/** openingHoursSpecification para Schema.org LocalBusiness. */
export function toOpeningHours(horarios: Horarios) {
  const spec: { "@type": string; dayOfWeek: string; opens: string; closes: string }[] = [];
  for (const item of horarios.items) {
    if (item.cerrado) continue;
    for (const tramo of item.tramos) {
      spec.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: DIA_SCHEMA_ORG[item.dia] ?? item.dia,
        opens: tramo.desde,
        closes: tramo.hasta,
      });
    }
  }
  return spec;
}
