/** Constantes de seguimiento de prospectos. Módulo plano (cliente y servidor). */

export const ESTADOS = ["nuevo", "contactado", "propuesta", "convertido", "descartado"] as const;
export type Estado = (typeof ESTADOS)[number];

export const ESTADO_LABEL: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  propuesta: "Propuesta",
  convertido: "Convertido",
  descartado: "Descartado",
};

/** Tipos de actividad que el usuario registra a mano (cambio_estado lo pone el sistema). */
export const ACTIVIDAD_TIPOS = ["nota", "llamada", "whatsapp", "email", "reunion", "propuesta"] as const;
export type ActividadTipo = (typeof ACTIVIDAD_TIPOS)[number];

export const ACTIVIDAD_LABEL: Record<string, string> = {
  nota: "Nota",
  llamada: "Llamada",
  whatsapp: "WhatsApp",
  email: "Email",
  reunion: "Reunión",
  propuesta: "Propuesta",
  cambio_estado: "Cambió de etapa",
};

export const ACTIVIDAD_ICON: Record<string, string> = {
  nota: "📝",
  llamada: "📞",
  whatsapp: "💬",
  email: "✉️",
  reunion: "🤝",
  propuesta: "📄",
  cambio_estado: "🔀",
};
