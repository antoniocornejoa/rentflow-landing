-- ============================================================================
-- 0001 — Extensiones y tipos enumerados
-- Plataforma multi-tenant de landing pages. Todo vive en el schema `public`.
-- ============================================================================

-- citext: email/dominio/slug/hostname case-insensitive con unicidad correcta.
create extension if not exists "citext" with schema extensions;
-- pgcrypto: por compatibilidad (gen_random_uuid() ya es core en PG13+).
create extension if not exists "pgcrypto" with schema extensions;

-- ── Enums (vocabularios controlados: integridad + eficiencia) ────────────────

-- Rol global del usuario.
create type public.app_rol as enum ('admin', 'cliente');

-- Rol del usuario dentro de un tenant específico.
create type public.tenant_rol as enum ('propietario', 'editor');

-- Bandera de servicio que lee el edge para decidir el render.
-- Derivada de subscriptions por el cron de facturación (no es fuente de dinero).
create type public.tenant_estado as enum (
  'onboarding',  -- pre-lanzamiento -> página "coming soon"
  'activo',      -- landing en producción
  'suspendido',  -- corte manual/admin -> página de mantención
  'moroso',      -- pago vencido en gracia -> página de mantención
  'cancelado'    -- churn -> 404 / redirect
);

-- Los 3 planes comerciales (detalle de precio/features en la tabla `planes`).
create type public.plan_tipo as enum ('basico', 'pro', 'premium');

-- Las 4 plantillas verticales sobre el mismo jsonb.
create type public.plantilla_tipo as enum ('servicios', 'gastronomia', 'inmobiliaria', 'retail');

-- Canal de captación del lead.
create type public.lead_origen as enum ('formulario', 'whatsapp', 'llamada');

-- Gestión del lead en el portal del cliente.
create type public.lead_estado as enum ('nuevo', 'contactado', 'atendido', 'descartado');

-- Segmentación de tráfico sin cookies (derivada del User-Agent en el servidor).
create type public.device_tipo as enum ('mobile', 'tablet', 'desktop');

-- Salud de pago agregada de la cuenta (vive en subscriptions).
create type public.cuenta_estado_pago as enum ('al_dia', 'pendiente', 'vencido');

-- Estado de un cobro individual (vive en payments).
create type public.pago_estado as enum ('pagado', 'pendiente', 'fallido', 'reembolsado');

-- Solicitudes de cambios mayores del portal.
create type public.change_request_tipo as enum ('contenido', 'diseno', 'funcionalidad', 'otro');
create type public.change_request_estado as enum ('pendiente', 'en_proceso', 'completado', 'rechazado');
create type public.prioridad as enum ('baja', 'media', 'alta');

-- Funnel de ventas del sitio comercial.
create type public.prospect_estado as enum ('nuevo', 'contactado', 'propuesta', 'convertido', 'descartado');
