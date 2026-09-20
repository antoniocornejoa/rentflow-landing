-- ============================================================================
-- 0002 — Tablas núcleo: tenants, dominios, usuarios, contenido, tema, planes
-- ============================================================================

-- ── planes: catálogo de los 3 planes (precios/features) editable sin deploy ──
create table public.planes (
  plan          public.plan_tipo primary key,
  nombre        text not null,
  precio        integer not null check (precio >= 0),  -- CLP en pesos enteros
  descripcion   text,
  features      jsonb not null default '[]'::jsonb,
  limite_leads  integer,                                -- NULL = ilimitado
  activo        boolean not null default true,
  orden         smallint not null default 0,
  updated_at    timestamptz not null default now()
);
comment on table public.planes is 'Catálogo de planes; alimenta pricing, calculadora y el monto por defecto de subscriptions.';

-- ── tenants: fila maestra que el middleware resuelve por host ────────────────
create table public.tenants (
  id                 uuid primary key default gen_random_uuid(),
  nombre_negocio     text not null,
  slug               citext not null unique
                       check (slug ~ '^[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])$'),
  dominio            citext unique,               -- dominio primario de display
  plan               public.plan_tipo not null,
  estado             public.tenant_estado not null default 'onboarding',
  plantilla          public.plantilla_tipo not null,
  fecha_inicio       date not null default current_date,
  estado_changed_at  timestamptz,
  notas_internas     text,                        -- solo operador (RLS)
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
comment on column public.tenants.estado is 'Bandera de servicio derivada de subscriptions; leída por el edge para decidir el render.';
create index tenants_estado_idx on public.tenants (estado);
create index tenants_plan_idx on public.tenants (plan);

-- ── tenant_domains: hostnames -> tenant (fuente de ruteo) ────────────────────
create table public.tenant_domains (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  hostname    citext not null unique,
  is_primary  boolean not null default false,
  verificado  boolean not null default false,     -- DNS apuntado + cert emitido
  created_at  timestamptz not null default now()
);
create index tenant_domains_tenant_idx on public.tenant_domains (tenant_id);
-- Un único dominio primario por tenant.
create unique index tenant_domains_one_primary_idx
  on public.tenant_domains (tenant_id) where is_primary;

-- ── users: perfil + rol global, espejo de auth.users ─────────────────────────
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         citext not null unique,
  nombre        text,
  rol           public.app_rol not null default 'cliente',
  telefono      text,
  last_login_at timestamptz,
  created_at    timestamptz not null default now()
);
create index users_rol_idx on public.users (rol);

-- ── tenant_users: N:M usuario<->tenant (base del aislamiento RLS) ────────────
create table public.tenant_users (
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  rol         public.tenant_rol not null default 'propietario',
  created_at  timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create index tenant_users_user_idx on public.tenant_users (user_id);

-- ── tenant_content: contenido de la landing en jsonb (1:1) ───────────────────
create table public.tenant_content (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null unique references public.tenants(id) on delete cascade,
  plantilla          public.plantilla_tipo not null,
  content_published  jsonb not null default '{}'::jsonb,
  content_draft      jsonb,                        -- NULL = sin cambios pendientes
  schema_version     smallint not null default 1,
  published_version  integer not null default 1,
  published_at       timestamptz,
  draft_updated_at   timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- Red de seguridad barata (la validación rica es Zod en la server action).
  constraint tenant_content_published_obj check (jsonb_typeof(content_published) = 'object'),
  constraint tenant_content_draft_obj check (content_draft is null or jsonb_typeof(content_draft) = 'object')
);
comment on table public.tenant_content is 'Fila caliente 1:1: ISR lee content_published en una sola consulta sin joins.';

-- ── tenant_content_versions: historial append-only para rollback ─────────────
create table public.tenant_content_versions (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  version         integer not null,
  content         jsonb not null,
  plantilla       public.plantilla_tipo not null,
  schema_version  smallint not null,
  publicado       boolean not null default true,
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (tenant_id, version)
);
create index tenant_content_versions_recent_idx
  on public.tenant_content_versions (tenant_id, created_at desc);

-- ── tenant_theme: identidad visual (1:1) ─────────────────────────────────────
create table public.tenant_theme (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null unique references public.tenants(id) on delete cascade,
  colores        jsonb not null default '{}'::jsonb,   -- -> variables CSS
  tipografia     jsonb not null default '{}'::jsonb,
  logo_path      text,                                  -- key de Storage, NO URL
  logo_alt       text,
  favicon_path   text,
  og_image_path  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── plantilla_defaults: contenido/tema semilla por plantilla ─────────────────
-- Permite que "alta cliente" = INSERT + seed automático (criterio <15 min).
create table public.plantilla_defaults (
  plantilla   public.plantilla_tipo primary key,
  content     jsonb not null,
  theme       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
