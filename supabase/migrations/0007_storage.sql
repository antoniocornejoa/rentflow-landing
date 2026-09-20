-- ============================================================================
-- 0007 — Supabase Storage: bucket público de medios por tenant
-- Convención de path: '{tenant_id}/...'  (el primer segmento es el tenant_id).
-- La BD solo guarda paths; next/image construye las URLs AVIF/WebP.
-- ============================================================================

-- Helper: castea a uuid sin lanzar error (devuelve NULL si no es uuid válido).
create or replace function public.safe_uuid(t text)
returns uuid
language plpgsql
immutable
as $$
begin
  return t::uuid;
exception when others then
  return null;
end;
$$;
grant execute on function public.safe_uuid(text) to anon, authenticated;

-- Bucket público (imágenes world-readable para CDN/Lighthouse). Máx 5 MB, solo imágenes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tenant-media',
  'tenant-media',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/svg+xml']
)
on conflict (id) do nothing;

-- Lectura pública de las imágenes.
create policy "tenant_media_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'tenant-media');

-- Escritura restringida al dueño del tenant (carpeta = tenant_id) o al admin.
create policy "tenant_media_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'tenant-media'
    and (
      public.is_admin()
      or public.safe_uuid((storage.foldername(name))[1]) in (select public.current_tenant_ids())
    )
  );

create policy "tenant_media_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'tenant-media'
    and (
      public.is_admin()
      or public.safe_uuid((storage.foldername(name))[1]) in (select public.current_tenant_ids())
    )
  )
  with check (
    bucket_id = 'tenant-media'
    and (
      public.is_admin()
      or public.safe_uuid((storage.foldername(name))[1]) in (select public.current_tenant_ids())
    )
  );

create policy "tenant_media_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'tenant-media'
    and (
      public.is_admin()
      or public.safe_uuid((storage.foldername(name))[1]) in (select public.current_tenant_ids())
    )
  );
