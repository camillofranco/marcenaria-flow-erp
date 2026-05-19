-- Buckets para arquivos do piloto.
-- Rodar no SQL Editor depois de criar o projeto Supabase.

insert into storage.buckets (id, name, public)
values
  ('project-files', 'project-files', false)
on conflict (id) do nothing;

create policy "project_files_authenticated_read"
on storage.objects
for select
using (
  bucket_id = 'project-files'
  and auth.role() = 'authenticated'
  and (
    public.is_platform_admin()
    or (storage.foldername(name))[1] = public.current_company_id()::text
  )
);

create policy "project_files_authenticated_insert"
on storage.objects
for insert
with check (
  bucket_id = 'project-files'
  and auth.role() = 'authenticated'
  and (
    public.is_platform_admin()
    or (storage.foldername(name))[1] = public.current_company_id()::text
  )
);

create policy "project_files_authenticated_update"
on storage.objects
for update
using (
  bucket_id = 'project-files'
  and auth.role() = 'authenticated'
  and (
    public.is_platform_admin()
    or (storage.foldername(name))[1] = public.current_company_id()::text
  )
)
with check (
  bucket_id = 'project-files'
  and auth.role() = 'authenticated'
  and (
    public.is_platform_admin()
    or (storage.foldername(name))[1] = public.current_company_id()::text
  )
);

-- Padrão de caminho esperado:
-- {company_id}/{project_id}/{categoria}/{nome-do-arquivo}
