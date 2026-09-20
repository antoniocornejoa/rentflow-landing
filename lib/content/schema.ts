import { z } from "zod";

/**
 * Contrato de contenido de las landings (jsonb de tenant_content).
 * Núcleo compartido + bloques propios por plantilla, discriminado por `plantilla`.
 * La validación rica vive aquí (Postgres no ejecuta Zod); la BD solo aplica CHECKs
 * livianos. `parseTenantContent` es la ÚNICA puerta de entrada al jsonb al renderizar.
 */

export const SCHEMA_VERSION = 1 as const;

// ── Hojas reutilizables ──────────────────────────────────────────────────────
export const zImageRef = z
  .object({
    path: z.string().min(1),
    alt: z.string().min(1, "El texto alternativo es obligatorio (accesibilidad)"),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    blurDataURL: z.string().optional(),
    caption: z.string().optional(),
  })
  .strict();
export type ImageRef = z.infer<typeof zImageRef>;

export const zCTA = z
  .object({
    label: z.string().min(1),
    tipo: z.enum(["whatsapp", "formulario", "telefono", "ancla", "url"]),
    destino: z.string().min(1).default("default"),
  })
  .strict()
  .superRefine((cta, ctx) => {
    if (cta.tipo === "ancla" && !cta.destino.startsWith("#")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Un CTA tipo 'ancla' debe apuntar a '#seccion'" });
    }
    if (cta.tipo === "url" && !/^https?:\/\//.test(cta.destino)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Un CTA tipo 'url' debe ser http(s)" });
    }
  });
export type CTA = z.infer<typeof zCTA>;

export const zPhone = z
  .string()
  .regex(/^\+56\d{9}$/, "Teléfono chileno en formato +56XXXXXXXXX");

export const zHHmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora HH:mm (24h)");

export const zMoney = z.number().int().nonnegative();

export const zUrl = z.string().url();

// ── Bloques compartidos ──────────────────────────────────────────────────────
export const zHero = z
  .object({
    titulo: z.string().min(1).max(90),
    subtitulo: z.string().max(160).optional(),
    eyebrow: z.string().max(40).optional(),
    imagen: zImageRef.optional(),
    cta_primario: zCTA,
    cta_secundario: zCTA.optional(),
    alineacion: z.enum(["izquierda", "centro"]).default("centro"),
    overlay: z.number().min(0).max(1).optional(),
  })
  .strict();

export const zConfianza = z
  .object({
    titulo: z.string().max(80).optional(),
    variante: z.enum(["metricas", "logos", "badges"]).default("metricas"),
    items: z
      .array(z.object({ icono: z.string().optional(), valor: z.string().min(1), etiqueta: z.string().min(1) }).strict())
      .min(1)
      .max(6),
    logos: z.array(zImageRef).max(12).optional(),
  })
  .strict();

export const zGaleria = z
  .object({
    titulo: z.string().max(80).optional(),
    imagenes: z.array(zImageRef).min(1).max(12),
    layout: z.enum(["grid", "carrusel", "masonry"]).default("grid"),
    columnas: z.number().int().min(1).max(4).optional(),
  })
  .strict();

export const zTestimonios = z
  .object({
    titulo: z.string().max(80).optional(),
    items: z
      .array(
        z
          .object({
            autor: z.string().min(1),
            texto: z.string().min(1).max(500),
            rol: z.string().optional(),
            avatar: zImageRef.optional(),
            rating: z.number().int().min(1).max(5).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(12),
  })
  .strict();

export const zUbicacion = z
  .object({
    direccion: z.string().min(1),
    comuna: z.string().min(1),
    region: z.string().default("Maule"),
    lat: z.number().optional(),
    lng: z.number().optional(),
    google_maps_url: zUrl.optional(),
    mostrar_mapa: z.boolean().default(true),
  })
  .strict();

const zDia = z.enum(["lun", "mar", "mie", "jue", "vie", "sab", "dom"]);
export const zHorarios = z
  .object({
    items: z
      .array(
        z
          .object({
            dia: zDia,
            tramos: z.array(z.object({ desde: zHHmm, hasta: zHHmm }).strict()).default([]),
            cerrado: z.boolean().optional(),
          })
          .strict(),
      )
      .min(1),
    nota: z.string().optional(),
  })
  .strict();

export const zRedes = z
  .object({
    instagram: zUrl.optional(),
    facebook: zUrl.optional(),
    tiktok: zUrl.optional(),
    youtube: zUrl.optional(),
    linkedin: zUrl.optional(),
    sitio_web: zUrl.optional(),
  })
  .strict();

export const zWhatsapp = z
  .object({
    numero: zPhone,
    mensaje_prellenado: z.string().min(1).max(300),
    etiqueta_boton: z.string().max(40).default("Escríbenos"),
    mostrar_flotante: z.boolean().default(true),
  })
  .strict();

export const zSeo = z
  .object({
    title: z.string().min(1).max(60),
    description: z.string().min(1).max(160),
    og_image: zImageRef.optional(),
    keywords: z.array(z.string()).max(20).optional(),
    canonical: zUrl.optional(),
    indexable: z.boolean().default(true),
  })
  .strict();

const zCampoFormulario = z
  .object({
    nombre: z.string().min(1),
    etiqueta: z.string().min(1),
    tipo: z.enum(["texto", "email", "telefono", "textarea", "select", "checkbox"]),
    requerido: z.boolean().default(false),
    opciones: z.array(z.string()).optional(),
    placeholder: z.string().optional(),
  })
  .strict();
export type CampoFormulario = z.infer<typeof zCampoFormulario>;

export const zFormulario = z
  .object({
    titulo: z.string().max(80).optional(),
    campos: z.array(zCampoFormulario).min(1).max(10),
    boton_texto: z.string().max(40).default("Enviar"),
    mensaje_exito: z.string().max(200).default("¡Gracias! Te contactaremos pronto."),
    email_destino: z.string().email().optional(),
    consentimiento: z.boolean().default(false),
  })
  .strict();

// ── Bloques por plantilla ────────────────────────────────────────────────────
export const zServiciosBlock = z
  .object({
    titulo: z.string().max(80).optional(),
    variante: z.enum(["tarjetas", "lista"]).default("tarjetas"),
    items: z
      .array(
        z
          .object({
            nombre: z.string().min(1),
            descripcion: z.string().max(300).optional(),
            precio_desde: zMoney.optional(),
            imagen: zImageRef.optional(),
          })
          .strict(),
      )
      .min(1)
      .max(24),
  })
  .strict();

const zMenuItem = z
  .object({
    nombre: z.string().min(1),
    descripcion: z.string().max(200).optional(),
    precio: zMoney,
    etiquetas: z.array(z.string()).optional(),
    disponible: z.boolean().default(true),
    imagen: zImageRef.optional(),
  })
  .strict();
export const zMenu = z
  .object({
    moneda: z.literal("CLP").default("CLP"),
    categorias: z
      .array(z.object({ nombre: z.string().min(1), items: z.array(zMenuItem).min(1).max(40) }).strict())
      .min(1)
      .max(20),
    pedido_whatsapp: z
      .object({
        activo: z.boolean().default(true),
        incluir_items: z.boolean().default(true),
        mensaje_plantilla: z.string().max(120).default("Hola, quiero pedir:"),
      })
      .strict()
      .default({ activo: true, incluir_items: true, mensaje_plantilla: "Hola, quiero pedir:" }),
  })
  .strict();

export const zTipologias = z
  .object({
    titulo: z.string().max(80).optional(),
    items: z
      .array(
        z
          .object({
            nombre: z.string().min(1),
            dormitorios: z.number().int().min(0).max(10),
            banos: z.number().int().min(0).max(10).optional(),
            m2_utiles: z.number().positive().optional(),
            m2_totales: z.number().positive().optional(),
            precio_desde: z.number().positive(),
            moneda: z.enum(["UF", "CLP"]).default("UF"),
            plano: zImageRef.optional(),
            disponibilidad: z.enum(["disponible", "pocas_unidades", "agotado"]).default("disponible"),
          })
          .strict(),
      )
      .min(1)
      .max(30),
  })
  .strict();

export const zCotizador = z
  .object({
    activo: z.boolean().default(true),
    moneda: z.enum(["UF", "CLP"]).default("UF"),
    pie_min_pct: z.number().min(0).max(100).default(10),
    tasa_anual: z.number().min(0).max(30).default(4.5),
    plazos_anios: z.array(z.number().int().positive()).min(1).default([20, 25, 30]),
    nota_legal: z.string().max(300).default("Valores referenciales, no constituyen oferta."),
  })
  .strict();

export const zFormCorredora = z
  .object({
    email_corredora: z.string().email(),
    asunto: z.string().max(120).default("Nuevo interesado"),
    campos_extra: z.array(zCampoFormulario).max(6).default([]),
  })
  .strict();

const zProducto = z
  .object({
    nombre: z.string().min(1),
    descripcion: z.string().max(200).optional(),
    precio: zMoney.optional(),
    precio_oferta: zMoney.optional(),
    sku: z.string().optional(),
    stock: z.enum(["disponible", "bajo_pedido", "agotado"]).default("disponible"),
    etiquetas: z.array(z.string()).optional(),
    imagen: zImageRef.optional(),
  })
  .strict();
export const zCatalogo = z
  .object({
    moneda: z.literal("CLP").default("CLP"),
    mostrar_precios: z.boolean().default(true),
    consulta_whatsapp: z
      .object({
        activo: z.boolean().default(true),
        incluir_producto: z.boolean().default(true),
        mensaje_plantilla: z.string().max(120).default("Hola, consulto por:"),
      })
      .strict()
      .default({ activo: true, incluir_producto: true, mensaje_plantilla: "Hola, consulto por:" }),
    categorias: z
      .array(z.object({ nombre: z.string().min(1), items: z.array(zProducto).min(1).max(60) }).strict())
      .min(1)
      .max(20),
  })
  .strict();

// ── Base + unión discriminada por plantilla ──────────────────────────────────
const zBase = z.object({
  schema_version: z.literal(SCHEMA_VERSION),
  locale: z.literal("es-CL").default("es-CL"),
  orden: z.array(z.string()).optional(),
  hero: zHero,
  confianza: zConfianza.optional(),
  galeria: zGaleria.optional(),
  testimonios: zTestimonios.optional(),
  ubicacion: zUbicacion.optional(),
  horarios: zHorarios.optional(),
  redes: zRedes.optional(),
  whatsapp: zWhatsapp,
  seo: zSeo,
  formulario: zFormulario,
});

export const zServicios = zBase.extend({
  plantilla: z.literal("servicios"),
  servicios: zServiciosBlock,
});
export const zGastronomia = zBase.extend({
  plantilla: z.literal("gastronomia"),
  menu: zMenu,
});
export const zInmobiliaria = zBase.extend({
  plantilla: z.literal("inmobiliaria"),
  tipologias: zTipologias,
  cotizador: zCotizador.optional(),
  form_corredora: zFormCorredora.optional(),
});
export const zRetail = zBase.extend({
  plantilla: z.literal("retail"),
  catalogo: zCatalogo,
});

export const zTenantContent = z.discriminatedUnion("plantilla", [
  zServicios,
  zGastronomia,
  zInmobiliaria,
  zRetail,
]);

export type TenantContent = z.infer<typeof zTenantContent>;
export type ContenidoServicios = z.infer<typeof zServicios>;
export type ContenidoGastronomia = z.infer<typeof zGastronomia>;
export type ContenidoInmobiliaria = z.infer<typeof zInmobiliaria>;
export type ContenidoRetail = z.infer<typeof zRetail>;

export type Plantilla = TenantContent["plantilla"];

// ── Migración + parseo resiliente ────────────────────────────────────────────

/** Encadena migradores hasta SCHEMA_VERSION. Hoy solo existe la v1. */
export function migrateContent(input: unknown): unknown {
  // Cuando exista v2, aquí se detecta input.schema_version y se aplican migradores.
  return input;
}

export type ParseResultado =
  | { ok: true; content: TenantContent }
  | { ok: false; error: z.ZodError };

/** Puerta única de entrada al jsonb: migra y valida. Nunca lanza. */
export function parseTenantContent(raw: unknown): ParseResultado {
  const parsed = zTenantContent.safeParse(migrateContent(raw));
  if (parsed.success) return { ok: true, content: parsed.data };
  return { ok: false, error: parsed.error };
}

/** Devuelve el schema Zod de una plantilla (para validar al guardar en el panel). */
export function schemaPorPlantilla(plantilla: Plantilla) {
  switch (plantilla) {
    case "servicios":
      return zServicios;
    case "gastronomia":
      return zGastronomia;
    case "inmobiliaria":
      return zInmobiliaria;
    case "retail":
      return zRetail;
  }
}
