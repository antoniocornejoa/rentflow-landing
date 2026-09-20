-- ============================================================================
-- 0003 — Tablas de negocio: leads, subscriptions, payments, reportes,
--        solicitudes de cambio y prospectos comerciales
-- ============================================================================

-- ── leads: captación desde la landing (núcleo de valor) ──────────────────────
create table public.leads (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  nombre        text,
  telefono      text,                              -- text: preserva +56 y ceros
  email         citext,
  mensaje       text,
  origen        public.lead_origen not null,
  estado        public.lead_estado not null default 'nuevo',
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  utm_term      text,
  utm_content   text,
  referrer      text,
  path          text,
  device        public.device_tipo,
  metadata      jsonb not null default '{}'::jsonb,  -- campos por plantilla
  atendido_at   timestamptz,
  atendido_por  uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  -- El clic de WhatsApp puede no traer datos de contacto.
  constraint leads_contacto_o_whatsapp
    check (telefono is not null or email is not null or origen = 'whatsapp')
);
create index leads_tenant_created_idx on public.leads (tenant_id, created_at desc);
create index leads_tenant_estado_idx on public.leads (tenant_id, estado);
create index leads_tenant_origen_created_idx on public.leads (tenant_id, origen, created_at desc);

-- ── subscriptions: relación comercial 1:1 (FUENTE DE VERDAD del dinero) ──────
create table public.subscriptions (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null unique references public.tenants(id) on delete cascade,
  plan          public.plan_tipo not null,
  monto         integer not null check (monto >= 0),          -- CLP entero
  moneda        char(3) not null default 'CLP' check (moneda = 'CLP'),
  dia_cobro     smallint not null check (dia_cobro between 1 and 28),
  estado_pago   public.cuenta_estado_pago not null default 'al_dia',
  fecha_corte   date,                                          -- vive AQUÍ, no en tenants
  proximo_cobro date,
  ultimo_pago   date,                                          -- denormalizado por trigger
  inicio        date not null default current_date,
  cancelado_at  timestamptz,                                   -- marca churn
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index subscriptions_estado_pago_idx on public.subscriptions (estado_pago);
create index subscriptions_fecha_corte_idx on public.subscriptions (fecha_corte);
create index subscriptions_proximo_cobro_idx on public.subscriptions (proximo_cobro);

-- ── payments: historial de cobros por período (MRR, churn) ───────────────────
create table public.payments (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  subscription_id  uuid references public.subscriptions(id) on delete set null,
  periodo          date not null,                    -- primer día del mes facturado
  monto            integer not null check (monto >= 0),
  moneda           char(3) not null default 'CLP',
  estado           public.pago_estado not null default 'pendiente',
  metodo           text,                             -- transferencia, webpay, khipu...
  referencia       text,
  pagado_at        timestamptz,
  created_at       timestamptz not null default now(),
  unique (tenant_id, periodo)
);
create index payments_periodo_idx on public.payments (periodo);
create index payments_tenant_created_idx on public.payments (tenant_id, created_at desc);

-- ── monthly_reports: histórico del reporte mensual automático ────────────────
create table public.monthly_reports (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  periodo          date not null,                    -- mes reportado (primer día)
  visitas          integer not null default 0,
  visitantes       integer,
  leads_total      integer not null default 0,
  leads_por_origen jsonb not null default '{}'::jsonb,
  top_paths        jsonb not null default '{}'::jsonb,
  comparativa      jsonb not null default '{}'::jsonb,  -- vs mes anterior
  generado_at      timestamptz not null default now(),
  email_enviado    boolean not null default false,
  email_message_id text,                             -- ID de Resend
  created_at       timestamptz not null default now(),
  unique (tenant_id, periodo)
);
create index monthly_reports_periodo_idx on public.monthly_reports (periodo);

-- ── change_requests: solicitudes de "cambios mayores" del portal ─────────────
create table public.change_requests (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  solicitado_por uuid references public.users(id) on delete set null,
  tipo           public.change_request_tipo not null default 'contenido',
  titulo         text not null,
  descripcion    text not null,
  prioridad      public.prioridad not null default 'media',
  estado         public.change_request_estado not null default 'pendiente',
  adjuntos       jsonb not null default '[]'::jsonb,   -- paths de Storage
  respuesta      text,
  resuelto_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index change_requests_tenant_created_idx on public.change_requests (tenant_id, created_at desc);
create index change_requests_estado_idx on public.change_requests (estado);

-- ── prospects: interesados del sitio comercial (aún no clientes) ─────────────
create table public.prospects (
  id                   uuid primary key default gen_random_uuid(),
  nombre               text not null,
  email                citext,
  telefono             text,
  empresa              text,
  plan_interes         public.plan_tipo,
  plantilla_interes    public.plantilla_tipo,
  mensaje              text,
  origen               text,                          -- qué demo/CTA lo generó
  utm_source           text,
  utm_medium           text,
  utm_campaign         text,
  utm_term             text,
  utm_content          text,
  estado               public.prospect_estado not null default 'nuevo',
  convertido_tenant_id uuid references public.tenants(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index prospects_estado_idx on public.prospects (estado);
create index prospects_created_idx on public.prospects (created_at desc);
create index prospects_email_idx on public.prospects (email);
