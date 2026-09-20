-- ============================================================================
-- 0004 — Analítica propia sin cookies (page_views particionado + rollup diario)
-- Diseño: separar ingesta cruda (particionada, retención corta) de la consulta
-- (page_view_daily), para mantener la BD chica y los dashboards rápidos.
-- ============================================================================

-- ── page_views (raw): particionada por mes por RANGE(created_at) ─────────────
create table public.page_views (
  id             bigint generated always as identity,
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  path           text not null,
  referrer_host  text,                    -- solo host, no URL completa
  device         public.device_tipo,
  visitor_hash   bytea,                   -- OPCIONAL: hash IP+UA rotado a diario
  created_at     timestamptz not null default now(),
  -- La PK debe incluir la columna de partición.
  primary key (id, created_at)
) partition by range (created_at);

comment on table public.page_views is 'Ingesta cruda de visitas. Retención ~90 días vía DROP PARTITION; el histórico vive en page_view_daily.';

-- Índice para consultas recientes y el job de rollup (se propaga a las particiones).
create index page_views_tenant_created_idx on public.page_views (tenant_id, created_at);

-- Crea (idempotente) la partición mensual que contiene p_month.
create or replace function public.page_views_create_partition(p_month date)
returns void
language plpgsql
as $$
declare
  start_date date := date_trunc('month', p_month)::date;
  end_date   date := (date_trunc('month', p_month) + interval '1 month')::date;
  part_name  text := format('page_views_%s', to_char(start_date, 'YYYYMM'));
begin
  execute format(
    'create table if not exists public.%I partition of public.page_views for values from (%L) to (%L)',
    part_name, start_date, end_date
  );
end;
$$;

-- Asegura las particiones del mes actual y los próximos 2 meses (la llama el cron).
create or replace function public.page_views_ensure_partitions()
returns void
language plpgsql
as $$
begin
  perform public.page_views_create_partition(current_date);
  perform public.page_views_create_partition((current_date + interval '1 month')::date);
  perform public.page_views_create_partition((current_date + interval '2 months')::date);
end;
$$;

-- Elimina (idempotente) la partición de un mes ya consolidado en el rollup.
create or replace function public.page_views_drop_partition(p_month date)
returns void
language plpgsql
as $$
declare
  start_date date := date_trunc('month', p_month)::date;
  part_name  text := format('page_views_%s', to_char(start_date, 'YYYYMM'));
begin
  execute format('drop table if exists public.%I', part_name);
end;
$$;

-- Crea las particiones iniciales al aplicar la migración.
do $$ begin perform public.page_views_ensure_partitions(); end $$;

-- ── page_view_daily: rollup diario por tenant (lo pobla el cron) ─────────────
create table public.page_view_daily (
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  fecha        date not null,
  visitas      integer not null default 0,
  visitantes   integer,                              -- únicos aprox (visitor_hash)
  por_device   jsonb not null default '{}'::jsonb,   -- {mobile,tablet,desktop}
  por_path     jsonb not null default '{}'::jsonb,   -- top paths con conteo
  por_referrer jsonb not null default '{}'::jsonb,   -- top hosts referentes
  updated_at   timestamptz not null default now(),
  primary key (tenant_id, fecha)
);
comment on table public.page_view_daily is 'Fuente del gráfico de 6 meses y del reporte mensual. ~18k filas/año a 50 tenants.';
