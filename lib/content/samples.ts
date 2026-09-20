import { z } from "zod";
import {
  type Plantilla,
  type TenantContent,
  parseTenantContent,
  zServicios,
  zGastronomia,
  zInmobiliaria,
  zRetail,
} from "@/lib/content/schema";

/**
 * Contenido de ejemplo por plantilla (temática Talca) para los demos navegables
 * del sitio comercial y para los tests. Se usa el MISMO camino de parseo que las
 * landings reales (parseTenantContent), así el demo valida el contrato de contenido.
 */

const servicios: z.input<typeof zServicios> = {
  schema_version: 1,
  plantilla: "servicios",
  hero: {
    eyebrow: "Taller mecánico en Talca",
    titulo: "Tu auto en manos expertas",
    subtitulo: "Mantención, diagnóstico y frenos con garantía. Agenda en 1 minuto.",
    cta_primario: { label: "Agendar por WhatsApp", tipo: "whatsapp" },
    cta_secundario: { label: "Ver servicios", tipo: "ancla", destino: "#servicios" },
  },
  confianza: {
    variante: "metricas",
    items: [
      { valor: "+15 años", etiqueta: "de experiencia" },
      { valor: "4.8★", etiqueta: "en Google" },
      { valor: "2.000+", etiqueta: "autos atendidos" },
    ],
  },
  servicios: {
    titulo: "Nuestros servicios",
    items: [
      { nombre: "Cambio de aceite", descripcion: "Incluye filtro y revisión de niveles.", precio_desde: 25000 },
      { nombre: "Scanner diagnóstico", descripcion: "Lectura de fallas del computador.", precio_desde: 15000 },
      { nombre: "Cambio de frenos", descripcion: "Pastillas y discos, mano de obra incluida.", precio_desde: 45000 },
      { nombre: "Alineación y balanceo", precio_desde: 20000 },
    ],
  },
  testimonios: {
    items: [
      { autor: "Juan P.", texto: "Rápidos y honestos. Me explicaron todo antes de cobrar.", rating: 5 },
      { autor: "María L.", texto: "Dejé el auto en la mañana y a media tarde estaba listo.", rating: 5 },
    ],
  },
  ubicacion: { direccion: "Av. San Miguel 123", comuna: "Talca", lat: -35.43, lng: -71.66 },
  horarios: {
    items: [
      { dia: "lun", tramos: [{ desde: "09:00", hasta: "18:00" }] },
      { dia: "mar", tramos: [{ desde: "09:00", hasta: "18:00" }] },
      { dia: "mie", tramos: [{ desde: "09:00", hasta: "18:00" }] },
      { dia: "jue", tramos: [{ desde: "09:00", hasta: "18:00" }] },
      { dia: "vie", tramos: [{ desde: "09:00", hasta: "18:00" }] },
      { dia: "sab", tramos: [{ desde: "09:00", hasta: "13:00" }] },
      { dia: "dom", cerrado: true, tramos: [] },
    ],
  },
  redes: { instagram: "https://instagram.com/tallerlosandes" },
  whatsapp: { numero: "+56912345678", mensaje_prellenado: "Hola, quiero agendar una mantención" },
  seo: {
    title: "Taller Mecánico en Talca | Los Andes",
    description: "Mantención, diagnóstico y frenos en Talca con garantía. Agenda por WhatsApp.",
  },
  formulario: {
    titulo: "Solicita tu hora",
    campos: [
      { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true },
      { nombre: "telefono", etiqueta: "Teléfono", tipo: "telefono", requerido: true },
      { nombre: "mensaje", etiqueta: "¿Qué necesitas?", tipo: "textarea", requerido: false },
    ],
  },
};

const gastronomia: z.input<typeof zGastronomia> = {
  schema_version: 1,
  plantilla: "gastronomia",
  hero: {
    titulo: "Café Central Talca",
    subtitulo: "Café de especialidad y sándwiches caseros en pleno centro.",
    cta_primario: { label: "Ver la carta", tipo: "ancla", destino: "#menu" },
    cta_secundario: { label: "Pedir por WhatsApp", tipo: "whatsapp" },
  },
  confianza: { variante: "metricas", items: [{ valor: "4.9★", etiqueta: "200+ reseñas" }] },
  menu: {
    categorias: [
      {
        nombre: "Cafetería",
        items: [
          { nombre: "Capuccino", precio: 3500, etiquetas: ["destacado"] },
          { nombre: "Latte", precio: 3800 },
          { nombre: "Espresso", precio: 2500 },
        ],
      },
      {
        nombre: "Sándwiches",
        items: [
          { nombre: "Barros Luco", descripcion: "Carne y queso derretido.", precio: 6900 },
          { nombre: "Italiano", descripcion: "Palta, tomate y mayo.", precio: 6500 },
        ],
      },
    ],
    pedido_whatsapp: { activo: true, incluir_items: true, mensaje_plantilla: "Hola, quiero pedir:" },
  },
  testimonios: { items: [{ autor: "Ana", texto: "El mejor café de Talca, sin discusión.", rating: 5 }] },
  ubicacion: { direccion: "1 Sur 456", comuna: "Talca" },
  horarios: { items: [{ dia: "lun", tramos: [{ desde: "08:30", hasta: "20:00" }] }] },
  redes: { instagram: "https://instagram.com/cafecentral" },
  whatsapp: { numero: "+56987654321", mensaje_prellenado: "Hola Café Central" },
  seo: { title: "Café en Talca | Café Central", description: "Café de especialidad y sándwiches. Pide por WhatsApp." },
  formulario: {
    campos: [
      { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true },
      { nombre: "telefono", etiqueta: "Teléfono", tipo: "telefono", requerido: true },
      { nombre: "mensaje", etiqueta: "Mensaje", tipo: "textarea", requerido: false },
    ],
  },
};

const inmobiliaria: z.input<typeof zInmobiliaria> = {
  schema_version: 1,
  plantilla: "inmobiliaria",
  hero: {
    eyebrow: "Proyecto en verde · Entrega 2027",
    titulo: "Edificio Mirador del Maule",
    subtitulo: "Departamentos de 2 y 3 dormitorios en Talca centro.",
    cta_primario: { label: "Cotizar ahora", tipo: "ancla", destino: "#cotizador" },
  },
  confianza: {
    variante: "badges",
    items: [
      { valor: "Entrega 2027", etiqueta: "en verde" },
      { valor: "Subsidio DS19", etiqueta: "aplica" },
    ],
  },
  tipologias: {
    items: [
      { nombre: "Tipo B", dormitorios: 2, banos: 2, m2_utiles: 54, m2_totales: 62, precio_desde: 3200, moneda: "UF", disponibilidad: "disponible" },
      { nombre: "Tipo C", dormitorios: 3, banos: 2, m2_utiles: 72, precio_desde: 4100, moneda: "UF", disponibilidad: "pocas_unidades" },
    ],
  },
  cotizador: { activo: true, moneda: "UF", pie_min_pct: 10, tasa_anual: 4.5, plazos_anios: [20, 25, 30] },
  form_corredora: { email_corredora: "ventas@corredora.cl", asunto: "Lead Mirador del Maule", campos_extra: [] },
  ubicacion: { direccion: "4 Norte 890", comuna: "Talca", lat: -35.42, lng: -71.65 },
  whatsapp: { numero: "+56911112222", mensaje_prellenado: "Hola, me interesa el Edificio Mirador" },
  seo: { title: "Departamentos en Talca | Mirador del Maule", description: "2 y 3 dormitorios desde UF 3.200. Cotiza en línea." },
  formulario: {
    campos: [
      { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true },
      { nombre: "email", etiqueta: "Email", tipo: "email", requerido: true },
      { nombre: "telefono", etiqueta: "Teléfono", tipo: "telefono", requerido: true },
    ],
  },
};

const retail: z.input<typeof zRetail> = {
  schema_version: 1,
  plantilla: "retail",
  hero: {
    titulo: "Distribuidora El Roble",
    subtitulo: "Herramientas y ferretería en Talca. Despacho en el día.",
    cta_primario: { label: "Ver catálogo", tipo: "ancla", destino: "#catalogo" },
  },
  confianza: { variante: "metricas", items: [{ valor: "Despacho", etiqueta: "en el día" }] },
  catalogo: {
    mostrar_precios: true,
    consulta_whatsapp: { activo: true, incluir_producto: true, mensaje_plantilla: "Hola, consulto por:" },
    categorias: [
      {
        nombre: "Taladros",
        items: [
          { nombre: "Taladro percutor 650W", precio: 39990, precio_oferta: 34990, sku: "TP650", etiquetas: ["oferta"], stock: "disponible" },
          { nombre: "Atornillador inalámbrico", precio: 29990, stock: "disponible" },
        ],
      },
      {
        nombre: "Pinturas",
        items: [{ nombre: "Látex blanco 1gl", precio: 18990, stock: "bajo_pedido" }],
      },
    ],
  },
  testimonios: { items: [{ autor: "Pedro C.", texto: "Buenos precios y buena atención.", rating: 4 }] },
  ubicacion: { direccion: "5 Oriente 234", comuna: "Talca" },
  horarios: { items: [{ dia: "lun", tramos: [{ desde: "09:00", hasta: "19:00" }] }] },
  redes: { facebook: "https://facebook.com/elroble" },
  whatsapp: { numero: "+56933334444", mensaje_prellenado: "Hola El Roble" },
  seo: { title: "Ferretería en Talca | El Roble", description: "Herramientas, pinturas y ferretería. Consulta por WhatsApp." },
  formulario: {
    campos: [
      { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true },
      { nombre: "telefono", etiqueta: "Teléfono", tipo: "telefono", requerido: true },
    ],
  },
};

const RAW: Record<Plantilla, unknown> = { servicios, gastronomia, inmobiliaria, retail };

export const PLANTILLAS: Plantilla[] = ["servicios", "gastronomia", "inmobiliaria", "retail"];

/** Devuelve el contenido de ejemplo YA validado de una plantilla, o null si es inválido. */
export function getSampleContent(plantilla: Plantilla): TenantContent | null {
  const result = parseTenantContent(RAW[plantilla]);
  return result.ok ? result.content : null;
}
