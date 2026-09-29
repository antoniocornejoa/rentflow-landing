-- ─────────────────────────────────────────────────────────────────────────────
-- Módulo de Publicidad
--
-- Registro del gasto en campañas de marketing de la PLATAFORMA (para dar a
-- conocer RentFlow). Es nivel plataforma (no por cliente/tenant). Sólo admin.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.marketing_spend (
  id          uuid primary key default gen_random_uuid(),
  fecha       date not null default current_date,
  canal       text not null,                              -- google, instagram, facebook, tiktok, otro
  campana     text,                                       -- nombre de la campaña (opcional)
  monto       integer not null check (monto >= 0),        -- en CLP
  moneda      char(3) not null default 'CLP',
  notas       text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.marketing_spend enable row level security;

-- Sólo admin (mismo patrón que public.prospects). El panel escribe con
-- service_role (bypassa RLS); esta política protege cualquier otro acceso.
create policy marketing_spend_admin_all on public.marketing_spend
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

create index if not exists marketing_spend_fecha_idx on public.marketing_spend (fecha desc);

-- ── Extiende el contrato HQ: gasto de publicidad del mes en curso ────────────
-- (drop + create para poder insertar la columna nueva antes de `moneda`;
--  create or replace no permite reordenar columnas de una vista existente.)
drop view if exists public.hq_resumen;
create view public.hq_resumen as
select
  (select count(*) from public.tenants where estado = 'activo')::int                         as clientes_activos,
  (select count(*) from public.tenants where estado <> 'cancelado')::int                     as clientes_total,
  (select count(*) from public.prospects)::int                                               as prospectos_total,
  (select count(*) from public.prospects where estado = 'nuevo')::int                        as prospectos_nuevos,
  (select coalesce(sum(monto), 0) from public.subscriptions where cancelado_at is null)::int as mrr,
  (select coalesce(sum(monto), 0) from public.payments
     where pagado_at is not null and pagado_at >= date_trunc('month', now()))::int           as recaudado_mes,
  (select coalesce(sum(monto), 0) from public.marketing_spend
     where fecha >= date_trunc('month', now())::date)::int                                   as publicidad_mes,
  'CLP'::text                                                                                 as moneda;

comment on view public.hq_resumen is
  'Contrato HQ: KPIs estándar del negocio para el Centro de Control (incluye publicidad del mes).';
