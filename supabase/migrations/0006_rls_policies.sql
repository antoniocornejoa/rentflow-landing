-- ============================================================================
-- 0006 — Row Level Security en TODAS las tablas
--
-- Modelo:
--   anon          -> visitante sin sesión. Solo lee `planes` (pricing) y Storage.
--                    Las landings se renderizan server-side con service_role.
--                    La ingesta de leads/visitas/prospectos es server-side
--                    (service_role) -> anon NO tiene INSERT directo (Decisión C).
--   authenticated -> cliente pyme; acceso limitado a su(s) tenant(s).
--   admin         -> authenticated con claim app_metadata.role='admin' (is_admin()).
--   service_role  -> BYPASSRLS; solo server-side (render, ingesta, crons).
--
-- Regla base: ENABLE RLS + REVOKE ALL + GRANT mínimo por comando. Sin policy = deny.
-- ============================================================================

-- ── planes: pricing público ─────────────────────────────────────────────────
alter table public.planes enable row level security;
revoke all on public.planes from anon, authenticated;
grant select on public.planes to anon, authenticated;
grant insert, update, delete on public.planes to authenticated;

create policy planes_select_activos on public.planes
  for select to anon, authenticated
  using (activo or public.is_admin());
create policy planes_admin_insert on public.planes
  for insert to authenticated with check (public.is_admin());
create policy planes_admin_update on public.planes
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy planes_admin_delete on public.planes
  for delete to authenticated using (public.is_admin());

-- ── tenants ──────────────────────────────────────────────────────────────────
alter table public.tenants enable row level security;
revoke all on public.tenants from anon, authenticated;
grant select, insert, update, delete on public.tenants to authenticated;

create policy tenants_select_own on public.tenants
  for select to authenticated using (public.has_tenant_access(id));
create policy tenants_admin_insert on public.tenants
  for insert to authenticated with check (public.is_admin());
create policy tenants_admin_update on public.tenants
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy tenants_admin_delete on public.tenants
  for delete to authenticated using (public.is_admin());

-- ── tenant_domains ───────────────────────────────────────────────────────────
alter table public.tenant_domains enable row level security;
revoke all on public.tenant_domains from anon, authenticated;
grant select, insert, update, delete on public.tenant_domains to authenticated;

create policy tenant_domains_select_own on public.tenant_domains
  for select to authenticated using (public.has_tenant_access(tenant_id));
create policy tenant_domains_admin_insert on public.tenant_domains
  for insert to authenticated with check (public.is_admin());
create policy tenant_domains_admin_update on public.tenant_domains
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy tenant_domains_admin_delete on public.tenant_domains
  for delete to authenticated using (public.is_admin());

-- ── tenant_content (cliente lee; escritura admin; edición cliente vía RPC F3) ─
alter table public.tenant_content enable row level security;
revoke all on public.tenant_content from anon, authenticated;
grant select, insert, update, delete on public.tenant_content to authenticated;

create policy tenant_content_select_own on public.tenant_content
  for select to authenticated using (public.has_tenant_access(tenant_id));
create policy tenant_content_admin_insert on public.tenant_content
  for insert to authenticated with check (public.is_admin());
create policy tenant_content_admin_update on public.tenant_content
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy tenant_content_admin_delete on public.tenant_content
  for delete to authenticated using (public.is_admin());

-- ── tenant_content_versions (rollback: cliente lee; escritura service_role) ──
alter table public.tenant_content_versions enable row level security;
revoke all on public.tenant_content_versions from anon, authenticated;
grant select on public.tenant_content_versions to authenticated;

create policy tenant_content_versions_select_own on public.tenant_content_versions
  for select to authenticated using (public.has_tenant_access(tenant_id));

-- ── tenant_theme (cliente lee; escritura admin; edición cliente vía RPC F3) ──
alter table public.tenant_theme enable row level security;
revoke all on public.tenant_theme from anon, authenticated;
grant select, insert, update, delete on public.tenant_theme to authenticated;

create policy tenant_theme_select_own on public.tenant_theme
  for select to authenticated using (public.has_tenant_access(tenant_id));
create policy tenant_theme_admin_insert on public.tenant_theme
  for insert to authenticated with check (public.is_admin());
create policy tenant_theme_admin_update on public.tenant_theme
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy tenant_theme_admin_delete on public.tenant_theme
  for delete to authenticated using (public.is_admin());

-- ── users (cada uno se ve a sí mismo; rol solo lo cambia admin) ──────────────
alter table public.users enable row level security;
revoke all on public.users from anon, authenticated;
grant select, insert, update, delete on public.users to authenticated;

create policy users_select_self_or_admin on public.users
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy users_admin_insert on public.users
  for insert to authenticated with check (public.is_admin());
create policy users_admin_update on public.users
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy users_admin_delete on public.users
  for delete to authenticated using (public.is_admin());

-- ── tenant_users (auth.uid() DIRECTO -> anti-recursión) ──────────────────────
alter table public.tenant_users enable row level security;
revoke all on public.tenant_users from anon, authenticated;
grant select, insert, update, delete on public.tenant_users to authenticated;

create policy tenant_users_select_self_or_admin on public.tenant_users
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy tenant_users_admin_insert on public.tenant_users
  for insert to authenticated with check (public.is_admin());
create policy tenant_users_admin_update on public.tenant_users
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy tenant_users_admin_delete on public.tenant_users
  for delete to authenticated using (public.is_admin());

-- ── leads (cliente lee/actualiza sus leads; inserta service_role) ────────────
alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;
grant select, update on public.leads to authenticated;

create policy leads_select_own on public.leads
  for select to authenticated using (public.has_tenant_access(tenant_id));
create policy leads_update_own on public.leads
  for update to authenticated
  using (public.has_tenant_access(tenant_id))
  with check (public.has_tenant_access(tenant_id));

-- ── page_views (raw): sin acceso a anon/cliente; ingesta y rollup service_role ─
alter table public.page_views enable row level security;
revoke all on public.page_views from anon, authenticated;
-- Sin policy y sin grant => deny total para anon/authenticated. service_role bypassa.

-- ── page_view_daily (cliente lee agregados; escribe el cron) ─────────────────
alter table public.page_view_daily enable row level security;
revoke all on public.page_view_daily from anon, authenticated;
grant select on public.page_view_daily to authenticated;

create policy page_view_daily_select_own on public.page_view_daily
  for select to authenticated using (public.has_tenant_access(tenant_id));

-- ── subscriptions (cliente ve la suya; escritura admin/cron) ─────────────────
alter table public.subscriptions enable row level security;
revoke all on public.subscriptions from anon, authenticated;
grant select, insert, update, delete on public.subscriptions to authenticated;

create policy subscriptions_select_own on public.subscriptions
  for select to authenticated using (public.has_tenant_access(tenant_id));
create policy subscriptions_admin_insert on public.subscriptions
  for insert to authenticated with check (public.is_admin());
create policy subscriptions_admin_update on public.subscriptions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy subscriptions_admin_delete on public.subscriptions
  for delete to authenticated using (public.is_admin());

-- ── payments (cliente ve los suyos; escritura admin/cron) ────────────────────
alter table public.payments enable row level security;
revoke all on public.payments from anon, authenticated;
grant select, insert, update, delete on public.payments to authenticated;

create policy payments_select_own on public.payments
  for select to authenticated using (public.has_tenant_access(tenant_id));
create policy payments_admin_insert on public.payments
  for insert to authenticated with check (public.is_admin());
create policy payments_admin_update on public.payments
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy payments_admin_delete on public.payments
  for delete to authenticated using (public.is_admin());

-- ── monthly_reports (cliente lee su histórico; escribe el cron) ──────────────
alter table public.monthly_reports enable row level security;
revoke all on public.monthly_reports from anon, authenticated;
grant select on public.monthly_reports to authenticated;

create policy monthly_reports_select_own on public.monthly_reports
  for select to authenticated using (public.has_tenant_access(tenant_id));

-- ── change_requests (cliente crea/lee las suyas; admin gestiona) ─────────────
alter table public.change_requests enable row level security;
revoke all on public.change_requests from anon, authenticated;
grant select, insert, update, delete on public.change_requests to authenticated;

create policy change_requests_select_own on public.change_requests
  for select to authenticated using (public.has_tenant_access(tenant_id));
create policy change_requests_insert_own on public.change_requests
  for insert to authenticated with check (public.has_tenant_access(tenant_id));
create policy change_requests_admin_update on public.change_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy change_requests_admin_delete on public.change_requests
  for delete to authenticated using (public.is_admin());

-- ── prospects (solo admin; inserta service_role desde el sitio comercial) ────
alter table public.prospects enable row level security;
revoke all on public.prospects from anon, authenticated;
grant select, insert, update, delete on public.prospects to authenticated;

create policy prospects_admin_all on public.prospects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── plantilla_defaults (catálogo interno; solo admin lo edita) ───────────────
alter table public.plantilla_defaults enable row level security;
revoke all on public.plantilla_defaults from anon, authenticated;
grant select, insert, update, delete on public.plantilla_defaults to authenticated;

create policy plantilla_defaults_admin_all on public.plantilla_defaults
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
