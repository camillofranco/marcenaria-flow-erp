-- Endurecimento de seguranca para piloto real.
-- Reaplica politicas mais restritivas para compras, arquivos e storage.

drop policy if exists "purchases_select_related" on public.purchases;
drop policy if exists "purchases_update_adm_or_comprador" on public.purchases;
drop policy if exists "files_insert_project_members" on public.project_files;

create policy "purchases_select_project_members"
on public.purchases
for select
using (
  public.is_platform_admin()
  or (
    company_id = public.current_company_id()
    and exists (
      select 1
      from public.projects p
      where p.id = purchases.project_id
        and (
          public.is_adm()
          or p.projetista_id = auth.uid()
          or p.comprador_id = auth.uid()
        )
    )
  )
);

create policy "purchases_update_adm_or_assigned_comprador"
on public.purchases
for update
using (
  public.is_platform_admin()
  or (
    company_id = public.current_company_id()
    and exists (
      select 1
      from public.projects p
      where p.id = purchases.project_id
        and (
          public.is_adm()
          or p.comprador_id = auth.uid()
        )
    )
  )
)
with check (company_id = public.current_company_id() or public.is_platform_admin());

create policy "files_insert_project_members"
on public.project_files
for insert
with check (
  public.is_platform_admin()
  or (
    company_id = public.current_company_id()
    and exists (
      select 1
      from public.projects p
      where p.id = project_files.project_id
        and (
          public.is_adm()
          or p.medidor_id = auth.uid()
          or p.projetista_id = auth.uid()
          or p.montador_id = auth.uid()
        )
    )
  )
);

drop policy if exists "project_files_authenticated_read" on storage.objects;
drop policy if exists "project_files_authenticated_insert" on storage.objects;
drop policy if exists "project_files_authenticated_update" on storage.objects;

create or replace function public.can_access_project_storage_path(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  select coalesce(
    public.is_platform_admin()
    or exists (
      select 1
      from public.projects p
      where p.company_id = public.current_company_id()
        and p.id::text = (storage.foldername(object_name))[2]
        and (
          public.is_adm()
          or p.medidor_id = auth.uid()
          or p.projetista_id = auth.uid()
          or p.comprador_id = auth.uid()
          or p.montador_id = auth.uid()
          or p.cliente_id = auth.uid()
        )
    ),
    false
  )
$$;

create policy "project_files_project_members_read"
on storage.objects
for select
using (
  bucket_id = 'project-files'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = public.current_company_id()::text
  and public.can_access_project_storage_path(name)
);

create policy "project_files_project_members_insert"
on storage.objects
for insert
with check (
  bucket_id = 'project-files'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = public.current_company_id()::text
  and public.can_access_project_storage_path(name)
);

create policy "project_files_project_members_update"
on storage.objects
for update
using (
  bucket_id = 'project-files'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = public.current_company_id()::text
  and public.can_access_project_storage_path(name)
)
with check (
  bucket_id = 'project-files'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = public.current_company_id()::text
  and public.can_access_project_storage_path(name)
);
