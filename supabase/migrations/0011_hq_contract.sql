-- ─────────────────────────────────────────────────────────────────────────────
-- Contrato HQ / Centro de Control
--
-- Vistas de SOLO LECTURA que exponen los KPIs de este negocio en un formato
-- ESTÁNDAR, para que la plataforma central ("Centro de Control") las lea en vivo
-- igual en todos los negocios. Cada negocio nuevo implementa estas mismas vistas.
--
-- Sólo devuelven agregados (conteos y sumas) — nunca datos personales.
-- El Centro de Control las consulta con una llave/rol de SOLO LECTURA.
-- ─────────────────────────────────────────────────────────────────────────────

-- Snapshot actual del negocio (una fila).
create or replace view public.hq_resumen as
select
  (select count(*) from public.tenants where estado = 'activo')::int                                  as clientes_activos,
  (select count(*) from public.tenants where estado <> 'cancelado')::int                              as clientes_total,
  (select count(*) from public.prospects)::int                                                        as prospectos_total,
  (select count(*) from public.prospects where estado = 'nuevo')::int                                 as prospectos_nuevos,
  -- MRR: suma de suscripciones no canceladas (lo facturado recurrente).
  (select coalesce(sum(monto), 0) from public.subscriptions where cancelado_at is null)::int          as mrr,
  -- Recaudado del mes en curso: plata efectivamente cobrada (pagos con pagado_at).
  (select coalesce(sum(monto), 0) from public.payments
     where pagado_at is not null
       and pagado_at >= date_trunc('month', now()))::int                                              as recaudado_mes,
  'CLP'::text                                                                                          as moneda;

comment on view public.hq_resumen is
  'Contrato HQ: KPIs estándar del negocio para el Centro de Control (solo agregados).';

-- Serie mensual de lo recaudado (últimos 12 meses), para el gráfico de tendencia.
create or replace view public.hq_recaudado_mensual as
select
  to_char(date_trunc('month', pagado_at), 'YYYY-MM')  as mes,
  coalesce(sum(monto), 0)::int                        as recaudado
from public.payments
where pagado_at is not null
  and pagado_at >= date_trunc('month', now()) - interval '11 months'
group by 1
order by 1;

comment on view public.hq_recaudado_mensual is
  'Contrato HQ: recaudación mensual (12 meses) para la tendencia del Centro de Control.';
