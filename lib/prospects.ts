import { z } from "zod";
import { zTracking } from "@/lib/utm";

/** Payload del formulario del sitio comercial (crea un prospecto). */
export const zProspectInput = z
  .object({
    nombre: z.string().min(2).max(120),
    email: z.string().email().max(200).optional().or(z.literal("")),
    telefono: z.string().max(40).optional(),
    empresa: z.string().max(120).optional(),
    plan_interes: z.enum(["basico", "pro", "premium"]).optional().or(z.literal("")),
    plantilla_interes: z.enum(["servicios", "gastronomia", "inmobiliaria", "retail"]).optional().or(z.literal("")),
    mensaje: z.string().max(2000).optional(),
    origen: z.string().max(120).optional(),
    tracking: zTracking.optional(),
    hp: z.string().max(0).optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (!v.email && !v.telefono) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ingresa email o teléfono" });
    }
  });

export type ProspectInput = z.infer<typeof zProspectInput>;
