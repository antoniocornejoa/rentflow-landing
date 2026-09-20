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
    metadata: z
      .record(z.string().max(64), z.unknown())
      .refine((m) => Object.keys(m).length <= 30 && JSON.stringify(m).length <= 4096, {
        message: "metadata demasiado grande",
      })
      .optional(),
    tracking: zTracking.optional(),
    // Anti-spam: honeypot (se acepta con contenido para descartar en silencio).
    hp: z.string().max(200).optional(),
    turnstileToken: z.string().max(4096).optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    // Un lead que no es clic de WhatsApp necesita al menos un dato de contacto o mensaje.
    if (v.origen !== "whatsapp" && !v.telefono && !v.email && !v.mensaje) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ingresa teléfono, email o un mensaje" });
    }
  });

export type LeadInput = z.infer<typeof zLeadInput>;
