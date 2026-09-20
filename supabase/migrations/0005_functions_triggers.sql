-- ============================================================================
-- 0005 — Funciones, triggers y helpers de RLS
-- ============================================================================

-- ── updated_at automático ────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.planes
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.tenant_content
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.tenant_theme
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.change_requests
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.prospects
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.plantilla_defaults
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.page_view_daily
  for each row execute function public.set_updated_at();

-- ── tenants: updated_at + auditoría de cambios de estado ─────────────────────
create or replace function public.tenants_before_update()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if new.estado is distinct from old.estado then
    new.estado_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger tenants_before_update before update on public.tenants
  for each row execute function public.tenants_before_update();

-- ── Alta de perfil al crear el usuario de Auth ───────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null then
    return new;  -- magic link siempre trae email; otros proveedores se ignoran
  end if;
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── payments -> subscriptions (denormaliza último_pago / estado_pago) ────────
create or replace function public.sync_subscription_from_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado = 'pagado' then
    update public.subscriptions
      set ultimo_pago = coalesce(new.pagado_at::date, current_date),
          estado_pago = 'al_dia',
          updated_at  = now()
    where tenant_id = new.tenant_id;
  end if;
  return new;
end;
$$;

create trigger payments_sync_subscription
  after insert or update on public.payments
  for each row execute function public.sync_subscription_from_payment();

-- ── Coherencia tenant_content.plantilla == tenants.plantilla ─────────────────
create or replace function public.enforce_content_plantilla()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t_plantilla public.plantilla_tipo;
begin
  select plantilla into t_plantilla from public.tenants where id = new.tenant_id;
  if t_plantilla is null then
    raise exception 'tenant % no existe', new.tenant_id;
  end if;
  new.plantilla := t_plantilla;   -- fuerza coherencia
  return new;
end;
$$;

create trigger tenant_content_enforce_plantilla
  before insert or update on public.tenant_content
  for each row execute function public.enforce_content_plantilla();

-- ============================================================================
-- Helpers de RLS
-- ============================================================================

-- ¿El JWT actual es del operador? Lee el claim app_metadata.role (sin query).
-- Poblado por custom_access_token_hook desde public.users.rol.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- Conjunto de tenant_id del usuario actual (SECURITY DEFINER: sin recursión RLS).
create or replace function public.current_tenant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tu.tenant_id from public.tenant_users tu where tu.user_id = auth.uid();
$$;
revoke all on function public.current_tenant_ids() from public, anon;
grant execute on function public.current_tenant_ids() to authenticated;

-- Predicado central de aislamiento: admin ve todo; cliente solo su(s) tenant(s).
create or replace function public.has_tenant_access(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.tenant_users tu
    where tu.user_id = auth.uid() and tu.tenant_id = target
  );
$$;
revoke all on function public.has_tenant_access(uuid) from public, anon;
grant execute on function public.has_tenant_access(uuid) to authenticated;

-- ¿El tenant existe y está activo? Base de la lectura pública.
create or replace function public.is_active_tenant(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenants t where t.id = target and t.estado = 'activo'
  );
$$;
revoke all on function public.is_active_tenant(uuid) from public;
grant execute on function public.is_active_tenant(uuid) to anon, authenticated;

-- ============================================================================
-- Custom Access Token Hook: sincroniza users.rol y tenant_ids al JWT.
-- NOTA: hay que habilitarlo en Supabase -> Authentication -> Hooks
--       (Customize Access Token (JWT) Claims) apuntando a esta función.
-- ============================================================================
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims   jsonb;
  user_rol public.app_rol;
  uid      uuid := (event ->> 'user_id')::uuid;
begin
  claims := coalesce(event -> 'claims', '{}'::jsonb);
  if not (claims ? 'app_metadata') then
    claims := claims || jsonb_build_object('app_metadata', '{}'::jsonb);
  end if;

  select rol into user_rol from public.users where id = uid;
  if user_rol is not null then
    claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(user_rol::text), true);
  end if;

  claims := jsonb_set(
    claims,
    '{app_metadata,tenant_ids}',
    coalesce(
      (select jsonb_agg(tenant_id) from public.tenant_users where user_id = uid),
      '[]'::jsonb
    ),
    true
  );

  return jsonb_set(event, '{claims}', claims);
end;
$$;

revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
