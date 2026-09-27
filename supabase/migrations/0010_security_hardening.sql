-- ============================================================================
-- 0010 — Endurecimiento de seguridad (post-auditoría de advisors)
-- 1) RLS en las particiones de page_views (PostgREST las expone por separado;
--    el linter lo marca como ERROR aunque no tengan grants a anon/authenticated).
-- 2) search_path fijo en las funciones de particiones (WARN mutable search_path).
-- 3) Revoca EXECUTE de las funciones de trigger SECURITY DEFINER (no deben
--    llamarse por RPC desde el API público).
-- ============================================================================

-- (1) RLS en las particiones ya creadas. Sin políticas => deny para anon/auth;
--     service_role sigue funcionando (BYPASSRLS) para ingesta y rollup.
alter table if exists public.page_views_202609 enable row level security;
alter table if exists public.page_views_202610 enable row level security;
alter table if exists public.page_views_202611 enable row level security;

-- (1+2) Que las particiones futuras nazcan con RLS habilitada, y search_path fijo.
create or replace function public.page_views_create_partition(p_month date)
returns void language plpgsql set search_path = '' as $$
declare
  start_date date := date_trunc('month', p_month)::date;
  end_date   date := (date_trunc('month', p_month) + interval '1 month')::date;
  part_name  text := format('page_views_%s', to_char(start_date, 'YYYYMM'));
begin
  execute format(
    'create table if not exists public.%I partition of public.page_views for values from (%L) to (%L)',
    part_name, start_date, end_date
  );
  execute format('alter table public.%I enable row level security', part_name);
end;
$$;

create or replace function public.page_views_ensure_partitions()
returns void language plpgsql set search_path = '' as $$
begin
  perform public.page_views_create_partition(current_date);
  perform public.page_views_create_partition((current_date + interval '1 month')::date);
  perform public.page_views_create_partition((current_date + interval '2 months')::date);
end;
$$;

create or replace function public.page_views_drop_partition(p_month date)
returns void language plpgsql set search_path = '' as $$
declare
  start_date date := date_trunc('month', p_month)::date;
  part_name  text := format('page_views_%s', to_char(start_date, 'YYYYMM'));
begin
  execute format('drop table if exists public.%I', part_name);
end;
$$;

-- (3) Las funciones de trigger SECURITY DEFINER no deben ser invocables por RPC.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.enforce_content_plantilla() from public, anon, authenticated;
revoke execute on function public.sync_subscription_from_payment() from public, anon, authenticated;
