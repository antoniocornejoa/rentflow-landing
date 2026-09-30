-- ─────────────────────────────────────────────────────────────────────────────
-- Endurecer las vistas del contrato HQ
--
-- hq_resumen / hq_recaudado_mensual agregan métricas del negocio (clientes, MRR,
-- recaudado, publicidad). Sin esto quedaban como SECURITY DEFINER y podían
-- leerse vía la API sin sesión. Las pasamos a security_invoker (respetan RLS) y
-- les quitamos el acceso a anon/authenticated. El Centro de Control las lee con
-- una credencial de solo lectura (service_role), que no se ve afectada.
-- ─────────────────────────────────────────────────────────────────────────────

alter view public.hq_resumen set (security_invoker = on);
alter view public.hq_recaudado_mensual set (security_invoker = on);

revoke all on public.hq_resumen from anon, authenticated;
revoke all on public.hq_recaudado_mensual from anon, authenticated;
