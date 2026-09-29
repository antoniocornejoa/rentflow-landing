-- ─────────────────────────────────────────────────────────────────────────────
-- Seguimiento de prospectos (CRM)
--
-- Línea de tiempo de actividades por prospecto + fecha de próximo seguimiento.
-- Sólo admin (mismo patrón que public.prospects).
-- ─────────────────────────────────────────────────────────────────────────────

do $$ begin
  create type public.prospect_activity_tipo as enum
    ('nota', 'llamada', 'whatsapp', 'email', 'reunion', 'propuesta', 'cambio_estado');
exception when duplicate_object then null; end $$;

-- Próximo paso agendado por prospecto (para la lista y el aviso por correo).
alter table public.prospects add column if not exists proximo_seguimiento date;
create index if not exists prospects_proximo_seguimiento_idx
  on public.prospects (proximo_seguimiento) where proximo_seguimiento is not null;

create table if not exists public.prospect_activities (
  id            uuid primary key default gen_random_uuid(),
  prospect_id   uuid not null references public.prospects(id) on delete cascade,
  tipo          public.prospect_activity_tipo not null default 'nota',
  detalle       text,
  estado_nuevo  public.prospect_estado,                    -- sólo en filas de cambio de etapa
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

alter table public.prospect_activities enable row level security;

create policy prospect_activities_admin_all on public.prospect_activities
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

create index if not exists prospect_activities_prospect_idx
  on public.prospect_activities (prospect_id, created_at desc);
