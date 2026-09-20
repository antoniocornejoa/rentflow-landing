/**
 * Tipos de la base de datos (schema `public`), escritos a mano para reflejar las
 * migraciones de `supabase/migrations`. Una vez creado el proyecto Supabase,
 * regenera este archivo con `npm run db:types` para mantenerlo 100% en sync.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Enums = {
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

export type Database = {
  public: {
    Tables: {
      planes: {
        Row: { plan: Enums["plan_tipo"]; nombre: string; precio: number; descripcion: string | null; features: Json; limite_leads: number | null; activo: boolean; orden: number; updated_at: string };
        Insert: { plan: Enums["plan_tipo"]; nombre: string; precio: number; descripcion?: string | null; features?: Json; limite_leads?: number | null; activo?: boolean; orden?: number; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["planes"]["Insert"]>;
        Relationships: [];
      };
      tenants: {
        Row: { id: string; nombre_negocio: string; slug: string; dominio: string | null; plan: Enums["plan_tipo"]; estado: Enums["tenant_estado"]; plantilla: Enums["plantilla_tipo"]; fecha_inicio: string; estado_changed_at: string | null; notas_internas: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; nombre_negocio: string; slug: string; dominio?: string | null; plan: Enums["plan_tipo"]; estado?: Enums["tenant_estado"]; plantilla: Enums["plantilla_tipo"]; fecha_inicio?: string; estado_changed_at?: string | null; notas_internas?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
        Relationships: [];
      };
      tenant_domains: {
        Row: { id: string; tenant_id: string; hostname: string; is_primary: boolean; verificado: boolean; created_at: string };
        Insert: { id?: string; tenant_id: string; hostname: string; is_primary?: boolean; verificado?: boolean; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["tenant_domains"]["Insert"]>;
        Relationships: [];
      };
      tenant_content: {
        Row: { id: string; tenant_id: string; plantilla: Enums["plantilla_tipo"]; content_published: Json; content_draft: Json | null; schema_version: number; published_version: number; published_at: string | null; draft_updated_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; tenant_id: string; plantilla: Enums["plantilla_tipo"]; content_published?: Json; content_draft?: Json | null; schema_version?: number; published_version?: number; published_at?: string | null; draft_updated_at?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["tenant_content"]["Insert"]>;
        Relationships: [];
      };
      tenant_content_versions: {
        Row: { id: string; tenant_id: string; version: number; content: Json; plantilla: Enums["plantilla_tipo"]; schema_version: number; publicado: boolean; created_by: string | null; created_at: string };
        Insert: { id?: string; tenant_id: string; version: number; content: Json; plantilla: Enums["plantilla_tipo"]; schema_version: number; publicado?: boolean; created_by?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["tenant_content_versions"]["Insert"]>;
        Relationships: [];
      };
      tenant_theme: {
        Row: { id: string; tenant_id: string; colores: Json; tipografia: Json; logo_path: string | null; logo_alt: string | null; favicon_path: string | null; og_image_path: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; tenant_id: string; colores?: Json; tipografia?: Json; logo_path?: string | null; logo_alt?: string | null; favicon_path?: string | null; og_image_path?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["tenant_theme"]["Insert"]>;
        Relationships: [];
      };
      users: {
        Row: { id: string; email: string; nombre: string | null; rol: Enums["app_rol"]; telefono: string | null; last_login_at: string | null; created_at: string };
        Insert: { id: string; email: string; nombre?: string | null; rol?: Enums["app_rol"]; telefono?: string | null; last_login_at?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      tenant_users: {
        Row: { tenant_id: string; user_id: string; rol: Enums["tenant_rol"]; created_at: string };
        Insert: { tenant_id: string; user_id: string; rol?: Enums["tenant_rol"]; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["tenant_users"]["Insert"]>;
        Relationships: [];
      };
      leads: {
        Row: { id: string; tenant_id: string; nombre: string | null; telefono: string | null; email: string | null; mensaje: string | null; origen: Enums["lead_origen"]; estado: Enums["lead_estado"]; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; utm_term: string | null; utm_content: string | null; referrer: string | null; path: string | null; device: Enums["device_tipo"] | null; metadata: Json; atendido_at: string | null; atendido_por: string | null; created_at: string };
        Insert: { id?: string; tenant_id: string; nombre?: string | null; telefono?: string | null; email?: string | null; mensaje?: string | null; origen: Enums["lead_origen"]; estado?: Enums["lead_estado"]; utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null; utm_term?: string | null; utm_content?: string | null; referrer?: string | null; path?: string | null; device?: Enums["device_tipo"] | null; metadata?: Json; atendido_at?: string | null; atendido_por?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [];
      };
      page_views: {
        Row: { id: number; tenant_id: string; path: string; referrer_host: string | null; device: Enums["device_tipo"] | null; visitor_hash: string | null; created_at: string };
        Insert: { tenant_id: string; path: string; referrer_host?: string | null; device?: Enums["device_tipo"] | null; visitor_hash?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["page_views"]["Insert"]>;
        Relationships: [];
      };
      page_view_daily: {
        Row: { tenant_id: string; fecha: string; visitas: number; visitantes: number | null; por_device: Json; por_path: Json; por_referrer: Json; updated_at: string };
        Insert: { tenant_id: string; fecha: string; visitas?: number; visitantes?: number | null; por_device?: Json; por_path?: Json; por_referrer?: Json; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["page_view_daily"]["Insert"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: { id: string; tenant_id: string; plan: Enums["plan_tipo"]; monto: number; moneda: string; dia_cobro: number; estado_pago: Enums["cuenta_estado_pago"]; fecha_corte: string | null; proximo_cobro: string | null; ultimo_pago: string | null; inicio: string; cancelado_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; tenant_id: string; plan: Enums["plan_tipo"]; monto: number; moneda?: string; dia_cobro: number; estado_pago?: Enums["cuenta_estado_pago"]; fecha_corte?: string | null; proximo_cobro?: string | null; ultimo_pago?: string | null; inicio?: string; cancelado_at?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: { id: string; tenant_id: string; subscription_id: string | null; periodo: string; monto: number; moneda: string; estado: Enums["pago_estado"]; metodo: string | null; referencia: string | null; pagado_at: string | null; created_at: string };
        Insert: { id?: string; tenant_id: string; subscription_id?: string | null; periodo: string; monto: number; moneda?: string; estado?: Enums["pago_estado"]; metodo?: string | null; referencia?: string | null; pagado_at?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      monthly_reports: {
        Row: { id: string; tenant_id: string; periodo: string; visitas: number; visitantes: number | null; leads_total: number; leads_por_origen: Json; top_paths: Json; comparativa: Json; generado_at: string; email_enviado: boolean; email_message_id: string | null; created_at: string };
        Insert: { id?: string; tenant_id: string; periodo: string; visitas?: number; visitantes?: number | null; leads_total?: number; leads_por_origen?: Json; top_paths?: Json; comparativa?: Json; generado_at?: string; email_enviado?: boolean; email_message_id?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["monthly_reports"]["Insert"]>;
        Relationships: [];
      };
      change_requests: {
        Row: { id: string; tenant_id: string; solicitado_por: string | null; tipo: Enums["change_request_tipo"]; titulo: string; descripcion: string; prioridad: Enums["prioridad"]; estado: Enums["change_request_estado"]; adjuntos: Json; respuesta: string | null; resuelto_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; tenant_id: string; solicitado_por?: string | null; tipo?: Enums["change_request_tipo"]; titulo: string; descripcion: string; prioridad?: Enums["prioridad"]; estado?: Enums["change_request_estado"]; adjuntos?: Json; respuesta?: string | null; resuelto_at?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["change_requests"]["Insert"]>;
        Relationships: [];
      };
      prospects: {
        Row: { id: string; nombre: string; email: string | null; telefono: string | null; empresa: string | null; plan_interes: Enums["plan_tipo"] | null; plantilla_interes: Enums["plantilla_tipo"] | null; mensaje: string | null; origen: string | null; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; utm_term: string | null; utm_content: string | null; estado: Enums["prospect_estado"]; convertido_tenant_id: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; nombre: string; email?: string | null; telefono?: string | null; empresa?: string | null; plan_interes?: Enums["plan_tipo"] | null; plantilla_interes?: Enums["plantilla_tipo"] | null; mensaje?: string | null; origen?: string | null; utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null; utm_term?: string | null; utm_content?: string | null; estado?: Enums["prospect_estado"]; convertido_tenant_id?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["prospects"]["Insert"]>;
        Relationships: [];
      };
      plantilla_defaults: {
        Row: { plantilla: Enums["plantilla_tipo"]; content: Json; theme: Json; updated_at: string };
        Insert: { plantilla: Enums["plantilla_tipo"]; content: Json; theme?: Json; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["plantilla_defaults"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: Enums;
    CompositeTypes: { [_ in never]: never };
  };
};
