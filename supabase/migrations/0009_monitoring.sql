-- ─────────────────────────────────────────────────────────────────────────────
-- 0009 — Monitoreo y logs
-- Auditoría de acciones (quién hizo qué), historial de tareas automáticas (crons)
-- y registro de errores. Sólo lectura para el operador (is_admin()); la escritura
-- es server-side con service_role (bypassa RLS), igual que la ingesta y los crons.
-- anon no tiene acceso.
-- ─────────────────────────────────────────────────────────────────────────────

create type public.job_estado as enum ('running', 'success', 'error');

-- ── audit_log: quién hizo qué y cuándo ───────────────────────────────────────
create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.users(id) on delete set null,
  actor_email text,
  actor_rol   public.app_rol,
  accion      text not null,
  entidad     text,
  entidad_id  uuid,
  tenant_id   uuid references public.tenants(id) on delete set null,
  detalle     jsonb not null default '{}'::jsonb,
  ip          text,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);
create index audit_log_tenant_idx on public.audit_log (tenant_id, created_at desc);
create index audit_log_accion_idx on public.audit_log (accion);

-- ── job_runs: corridas de tareas automáticas (crons) ─────────────────────────
create table public.job_runs (
  id          uuid primary key default gen_random_uuid(),
  job         text not null,
  estado      public.job_estado not null default 'running',
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms integer,
  detalle     jsonb not null default '{}'::jsonb,
  error       text,
  created_at  timestamptz not null default now()
);
create index job_runs_job_idx on public.job_runs (job, started_at desc);
create index job_runs_estado_idx on public.job_runs (estado, started_at desc);

-- ── error_events: errores/avisos de la aplicación ────────────────────────────
create table public.error_events (
  id         uuid primary key default gen_random_uuid(),
  nivel      text not null default 'error' check (nivel in ('error', 'warn', 'info')),
  origen     text not null,
  mensaje    text not null,
  detalle    jsonb not null default '{}'::jsonb,
  tenant_id  uuid references public.tenants(id) on delete set null,
  created_at timestamptz not null default now()
);
create index error_events_created_idx on public.error_events (created_at desc);
create index error_events_nivel_idx on public.error_events (nivel, created_at desc);

-- ── RLS: sólo el admin lee; la escritura la hace service_role (bypassa RLS) ───
alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;
create policy audit_log_admin_select on public.audit_log
  for select to authenticated using ((select public.is_admin()));

alter table public.job_runs enable row level security;
revoke all on public.job_runs from anon, authenticated;
grant select on public.job_runs to authenticated;
create policy job_runs_admin_select on public.job_runs
  for select to authenticated using ((select public.is_admin()));

alter table public.error_events enable row level security;
revoke all on public.error_events from anon, authenticated;
grant select on public.error_events to authenticated;
create policy error_events_admin_select on public.error_events
  for select to authenticated using ((select public.is_admin()));
