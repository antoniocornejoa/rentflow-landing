/**
 * Tipos de la base de datos.
 *
 * NOTA: este archivo es un PLACEHOLDER parcial escrito a mano para la Fase 1
 * (cubre solo las tablas que el código usa hoy). Una vez creado el proyecto
 * Supabase, regenéralo completo con:
 *
 *   npm run db:types
 *
 * (requiere `supabase link` al proyecto).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          nombre_negocio: string;
          slug: string;
          dominio: string | null;
          plan: Database["public"]["Enums"]["plan_tipo"];
          estado: Database["public"]["Enums"]["tenant_estado"];
          plantilla: Database["public"]["Enums"]["plantilla_tipo"];
          fecha_inicio: string;
          estado_changed_at: string | null;
          notas_internas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre_negocio: string;
          slug: string;
          dominio?: string | null;
          plan: Database["public"]["Enums"]["plan_tipo"];
          estado?: Database["public"]["Enums"]["tenant_estado"];
          plantilla: Database["public"]["Enums"]["plantilla_tipo"];
          fecha_inicio?: string;
          estado_changed_at?: string | null;
          notas_internas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre_negocio?: string;
          slug?: string;
          dominio?: string | null;
          plan?: Database["public"]["Enums"]["plan_tipo"];
          estado?: Database["public"]["Enums"]["tenant_estado"];
          plantilla?: Database["public"]["Enums"]["plantilla_tipo"];
          fecha_inicio?: string;
          estado_changed_at?: string | null;
          notas_internas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tenant_domains: {
        Row: {
          id: string;
          tenant_id: string;
          hostname: string;
          is_primary: boolean;
          verificado: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          hostname: string;
          is_primary?: boolean;
          verificado?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          hostname?: string;
          is_primary?: boolean;
          verificado?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_domains_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_content: {
        Row: {
          id: string;
          tenant_id: string;
          plantilla: Database["public"]["Enums"]["plantilla_tipo"];
          content_published: Json;
          content_draft: Json | null;
          schema_version: number;
          published_version: number;
          published_at: string | null;
          draft_updated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          plantilla: Database["public"]["Enums"]["plantilla_tipo"];
          content_published?: Json;
          content_draft?: Json | null;
          schema_version?: number;
          published_version?: number;
          published_at?: string | null;
          draft_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          plantilla?: Database["public"]["Enums"]["plantilla_tipo"];
          content_published?: Json;
          content_draft?: Json | null;
          schema_version?: number;
          published_version?: number;
          published_at?: string | null;
          draft_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_content_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_theme: {
        Row: {
          id: string;
          tenant_id: string;
          colores: Json;
          tipografia: Json;
          logo_path: string | null;
          logo_alt: string | null;
          favicon_path: string | null;
          og_image_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          colores?: Json;
          tipografia?: Json;
          logo_path?: string | null;
          logo_alt?: string | null;
          favicon_path?: string | null;
          og_image_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          colores?: Json;
          tipografia?: Json;
          logo_path?: string | null;
          logo_alt?: string | null;
          favicon_path?: string | null;
          og_image_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_theme_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      planes: {
        Row: {
          plan: Database["public"]["Enums"]["plan_tipo"];
          nombre: string;
          precio: number;
          descripcion: string | null;
          features: Json;
          limite_leads: number | null;
          activo: boolean;
          orden: number;
          updated_at: string;
        };
        Insert: {
          plan: Database["public"]["Enums"]["plan_tipo"];
          nombre: string;
          precio: number;
          descripcion?: string | null;
          features?: Json;
          limite_leads?: number | null;
          activo?: boolean;
          orden?: number;
          updated_at?: string;
        };
        Update: {
          plan?: Database["public"]["Enums"]["plan_tipo"];
          nombre?: string;
          precio?: number;
          descripcion?: string | null;
          features?: Json;
          limite_leads?: number | null;
          activo?: boolean;
          orden?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      app_rol: "admin" | "cliente";
      tenant_rol: "propietario" | "editor";
      tenant_estado: "onboarding" | "activo" | "suspendido" | "moroso" | "cancelado";
      plan_tipo: "basico" | "pro" | "premium";
      plantilla_tipo: "servicios" | "gastronomia" | "inmobiliaria" | "retail";
      lead_origen: "formulario" | "whatsapp" | "llamada";
      lead_estado: "nuevo" | "contactado" | "atendido" | "descartado";
      device_tipo: "mobile" | "tablet" | "desktop";
      cuenta_estado_pago: "al_dia" | "pendiente" | "vencido";
      pago_estado: "pagado" | "pendiente" | "fallido" | "reembolsado";
      change_request_tipo: "contenido" | "diseno" | "funcionalidad" | "otro";
      change_request_estado: "pendiente" | "en_proceso" | "completado" | "rechazado";
      prioridad: "baja" | "media" | "alta";
      prospect_estado: "nuevo" | "contactado" | "propuesta" | "convertido" | "descartado";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
