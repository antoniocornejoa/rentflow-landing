import { z } from "zod";
import { zTracking } from "@/lib/utm";

/** Payload que envía el formulario / botón de WhatsApp de una landing al API de leads. */
export const zLeadInput = z
  .object({
    tenant_id: z.string().uuid(),
    origen: z.enum(["formulario", "whatsapp", "llamada"]),
    nombre: z.string().max(200).optional(),
    telefono: z.string().max(40).optional(),
    email: z.string().email().max(200).optional().or(z.literal("")),
    mensaje: z.string().max(2000).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    tracking: zTracking.optional(),
    // Anti-spam
    hp: z.string().max(0).optional(), // honeypot: debe venir vacío
    turnstileToken: z.string().optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    // Un lead de formulario/llamada necesita al menos un dato de contacto.
    if (v.origen !== "whatsapp" && !v.telefono && !v.email) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ingresa teléfono o email" });
    }
  });

export type LeadInput = z.infer<typeof zLeadInput>;
