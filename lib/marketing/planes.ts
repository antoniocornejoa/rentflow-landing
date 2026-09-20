import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PlanPublico {
  plan: string;
  nombre: string;
  precio: number;
  descripcion: string | null;
  features: string[];
  orden: number;
}

const FALLBACK: PlanPublico[] = [
  { plan: "basico", nombre: "Básico", precio: 29900, descripcion: "Landing profesional lista para captar clientes.", orden: 1, features: ["Landing con tu contenido", "Botón de WhatsApp", "Formulario de contacto", "Reportes de leads"] },
  { plan: "pro", nombre: "Pro", precio: 69900, descripcion: "Todo lo del Básico más analítica y galería ampliada.", orden: 2, features: ["Todo lo del Básico", "Galería y testimonios", "Analítica de visitas", "Reporte mensual por correo"] },
  { plan: "premium", nombre: "Premium", precio: 149000, descripcion: "Máxima presencia: catálogo/menú y soporte prioritario.", orden: 3, features: ["Todo lo del Pro", "Catálogo o menú", "Cotizador (inmobiliaria)", "Soporte prioritario"] },
];

/** Planes para el sitio comercial. Cae a valores por defecto si no hay BD/env. */
export async function getPlanes(): Promise<PlanPublico[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return FALLBACK;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("planes")
      .select("plan, nombre, precio, descripcion, features, orden, activo")
      .order("orden");
    if (!data || data.length === 0) return FALLBACK;
    return data
      .filter((p) => p.activo)
      .map((p) => ({
        plan: p.plan,
        nombre: p.nombre,
        precio: p.precio,
        descripcion: p.descripcion,
        orden: p.orden,
        features: Array.isArray(p.features) ? (p.features as string[]) : [],
      }));
  } catch {
    return FALLBACK;
  }
}
