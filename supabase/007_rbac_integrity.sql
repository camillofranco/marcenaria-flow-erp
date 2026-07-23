-- RBAC e integridade para operacao do piloto.
-- Restringe dados pessoais, campos editaveis e categorias de arquivos por papel.

drop policy if exists "profiles_select_own_company" on public.profiles;
drop policy if exists "profiles_update_self_or_adm" on public.profiles;
drop policy if exists "profiles_select_self_or_adm" on public.profiles;
drop policy if exists "profiles_update_adm" on public.profiles;

create policy "profiles_select_self_or_adm"
on public.profiles
for select
using (
  public.is_platform_admin()
  or id = auth.uid()
  or (company_id = public.current_company_id() and public.is_adm())
);

create policy "profiles_update_adm"
on public.profiles
for update
using (
  public.is_platform_admin()
  or (company_id = public.current_company_id() and public.is_adm())
)
with check (
  public.is_platform_admin()
  or (
    company_id = public.current_company_id()
    and public.is_adm()
    and platform_admin = false
  )
);

create or replace function public.enforce_profile_update_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.is_platform_admin() then
    return new;
  end if;

  if not public.is_adm()
    or new.id is distinct from old.id
    or new.company_id is distinct from old.company_id
    or new.email is distinct from old.email
    or new.platform_admin is distinct from old.platform_admin
    or (old.id = auth.uid() and new.active = false) then
    raise exception 'Alteracao de perfil nao permitida.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_enforce_update_scope on public.profiles;
create trigger profiles_enforce_update_scope
before update on public.profiles
for each row execute function public.enforce_profile_update_scope();

create or replace function public.project_directory()
returns table (
  id uuid,
  company_id uuid,
  full_name text,
  role public.user_role,
  active boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct pr.id, pr.company_id, pr.full_name, pr.role, pr.active
  from public.profiles pr
  where pr.active = true
    and (
      public.is_platform_admin()
      or (
        pr.company_id = public.current_company_id()
        and (
          public.is_adm()
          or pr.id = auth.uid()
          or exists (
            select 1
            from public.projects p
            where (
              p.medidor_id = auth.uid()
              or p.projetista_id = auth.uid()
              or p.comprador_id = auth.uid()
              or p.montador_id = auth.uid()
              or p.cliente_id = auth.uid()
            )
            and pr.id in (
              p.medidor_id,
              p.projetista_id,
              p.comprador_id,
              p.montador_id,
              p.cliente_id
            )
          )
        )
      )
    )
$$;

revoke all on function public.project_directory() from public;
grant execute on function public.project_directory() to authenticated;

drop policy if exists "projects_update_by_role" on public.projects;
drop policy if exists "projects_update_by_assigned_role" on public.projects;
drop policy if exists "projects_delete_adm" on public.projects;

create policy "projects_update_by_assigned_role"
on public.projects
for update
using (
  public.is_platform_admin()
  or (
    company_id = public.current_company_id()
    and (
      public.is_adm()
      or medidor_id = auth.uid()
      or projetista_id = auth.uid()
      or montador_id = auth.uid()
    )
  )
)
with check (company_id = public.current_company_id() or public.is_platform_admin());

create policy "projects_delete_adm"
on public.projects
for delete
using (
  public.is_platform_admin()
  or (company_id = public.current_company_id() and public.is_adm())
);

create or replace function public.enforce_project_update_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_fields text[];
begin
  if auth.role() = 'service_role' or public.is_platform_admin() or public.is_adm() then
    return new;
  end if;

  select coalesce(array_agg(key), array[]::text[])
  into changed_fields
  from jsonb_each(to_jsonb(new))
  where value is distinct from (to_jsonb(old) -> key)
    and key not in ('updated_at');

  if public.current_role() = 'medidor'
    and old.medidor_id = auth.uid()
    and changed_fields <@ array['status', 'notes']::text[] then
    return new;
  end if;

  if public.current_role() = 'projetista'
    and old.projetista_id = auth.uid()
    and changed_fields <@ array['status', 'started_design_at', 'notes']::text[] then
    return new;
  end if;

  if public.current_role() = 'montador'
    and old.montador_id = auth.uid()
    and changed_fields <@ array['notes']::text[] then
    return new;
  end if;

  raise exception 'Alteracao de projeto nao permitida para este perfil.'
    using errcode = '42501';
end;
$$;

drop trigger if exists projects_enforce_update_scope on public.projects;
create trigger projects_enforce_update_scope
before update on public.projects
for each row execute function public.enforce_project_update_scope();

create or replace function public.enforce_room_update_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_fields text[];
  project_record public.projects;
begin
  if auth.role() = 'service_role' or public.is_platform_admin() or public.is_adm() then
    return new;
  end if;

  select * into project_record
  from public.projects
  where id = old.project_id;

  select coalesce(array_agg(key), array[]::text[])
  into changed_fields
  from jsonb_each(to_jsonb(new))
  where value is distinct from (to_jsonb(old) -> key)
    and key not in ('updated_at');

  if public.current_role() = 'medidor'
    and project_record.medidor_id = auth.uid()
    and changed_fields <@ array['measurement_notes', 'measurement_photos_count']::text[] then
    return new;
  end if;

  if public.current_role() = 'projetista'
    and project_record.projetista_id = auth.uid()
    and changed_fields <@ array['design_done']::text[] then
    return new;
  end if;

  if public.current_role() = 'montador'
    and project_record.montador_id = auth.uid()
    and changed_fields <@ array['install_done', 'support_note', 'support_open']::text[] then
    return new;
  end if;

  raise exception 'Alteracao de ambiente nao permitida para este perfil.'
    using errcode = '42501';
end;
$$;

drop trigger if exists rooms_enforce_update_scope on public.rooms;
create trigger rooms_enforce_update_scope
before update on public.rooms
for each row execute function public.enforce_room_update_scope();

drop policy if exists "purchases_insert_projetista_or_adm" on public.purchases;
drop policy if exists "purchases_select_project_members" on public.purchases;
drop policy if exists "purchases_select_by_assignment" on public.purchases;
drop policy if exists "purchases_insert_assigned_projetista_or_adm" on public.purchases;

create policy "purchases_select_by_assignment"
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
          or (p.comprador_id = auth.uid() and purchases.approval = 'aprovado')
        )
    )
  )
);

create policy "purchases_insert_assigned_projetista_or_adm"
on public.purchases
for insert
with check (
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
        )
    )
  )
);

create or replace function public.enforce_purchase_update_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_fields text[];
  project_record public.projects;
begin
  if auth.role() = 'service_role' or public.is_platform_admin() or public.is_adm() then
    return new;
  end if;

  select * into project_record
  from public.projects
  where id = old.project_id;

  select coalesce(array_agg(key), array[]::text[])
  into changed_fields
  from jsonb_each(to_jsonb(new))
  where value is distinct from (to_jsonb(old) -> key)
    and key not in ('updated_at');

  if public.current_role() = 'comprador'
    and project_record.comprador_id = auth.uid()
    and old.approval = 'aprovado'
    and new.approval = old.approval
    and changed_fields <@ array[
      'purchase_status',
      'supplier',
      'estimated_cost',
      'invoice_path',
      'notes'
    ]::text[] then
    return new;
  end if;

  raise exception 'Alteracao de compra nao permitida para este perfil.'
    using errcode = '42501';
end;
$$;

drop trigger if exists purchases_enforce_update_scope on public.purchases;
create trigger purchases_enforce_update_scope
before update on public.purchases
for each row execute function public.enforce_purchase_update_scope();

create or replace function public.enforce_project_assignments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assignee_id uuid;
begin
  foreach assignee_id in array array[
    new.medidor_id,
    new.projetista_id,
    new.comprador_id,
    new.montador_id,
    new.cliente_id
  ]
  loop
    if assignee_id is not null and not exists (
      select 1
      from public.profiles pr
      where pr.id = assignee_id
        and pr.company_id = new.company_id
        and pr.active = true
    ) then
      raise exception 'Responsavel invalido para a empresa do projeto.'
        using errcode = '23514';
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists projects_enforce_assignments on public.projects;
create trigger projects_enforce_assignments
before insert or update on public.projects
for each row execute function public.enforce_project_assignments();

create or replace function public.enforce_project_child_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  project_company uuid;
  linked_room_id uuid;
begin
  select company_id into project_company
  from public.projects
  where id = new.project_id;

  if project_company is null or project_company is distinct from new.company_id then
    raise exception 'Projeto e empresa do registro nao correspondem.'
      using errcode = '23514';
  end if;

  if tg_table_name <> 'rooms' then
    linked_room_id := new.room_id;
    if linked_room_id is not null and not exists (
      select 1
      from public.rooms r
      where r.id = linked_room_id
        and r.project_id = new.project_id
        and r.company_id = new.company_id
    ) then
      raise exception 'Ambiente nao pertence ao projeto informado.'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists rooms_enforce_child_integrity on public.rooms;
create trigger rooms_enforce_child_integrity
before insert or update on public.rooms
for each row execute function public.enforce_project_child_integrity();

drop trigger if exists purchases_enforce_child_integrity on public.purchases;
create trigger purchases_enforce_child_integrity
before insert or update on public.purchases
for each row execute function public.enforce_project_child_integrity();

drop trigger if exists alerts_enforce_child_integrity on public.alerts;
create trigger alerts_enforce_child_integrity
before insert or update on public.alerts
for each row execute function public.enforce_project_child_integrity();

drop trigger if exists project_files_enforce_child_integrity on public.project_files;
create trigger project_files_enforce_child_integrity
before insert or update on public.project_files
for each row execute function public.enforce_project_child_integrity();

drop policy if exists "files_select_project_members" on public.project_files;
drop policy if exists "files_insert_project_members" on public.project_files;
drop policy if exists "files_select_by_role_and_category" on public.project_files;
drop policy if exists "files_insert_by_role_and_category" on public.project_files;

create policy "files_select_by_role_and_category"
on public.project_files
for select
using (
  public.is_platform_admin()
  or (
    company_id = public.current_company_id()
    and exists (
      select 1
      from public.projects p
      where p.id = project_files.project_id
        and (
          public.is_adm()
          or (p.medidor_id = auth.uid() and category = 'medicao')
          or (p.projetista_id = auth.uid() and category in ('medicao', 'engenharia', 'obra'))
          or (p.comprador_id = auth.uid() and category = 'compras')
          or (p.montador_id = auth.uid() and category in ('obra', 'assistencia'))
          or (p.cliente_id = auth.uid() and category = 'obra')
        )
    )
  )
);

create policy "files_insert_by_role_and_category"
on public.project_files
for insert
with check (
  public.is_platform_admin()
  or (
    company_id = public.current_company_id()
    and uploaded_by = auth.uid()
    and exists (
      select 1
      from public.projects p
      where p.id = project_files.project_id
        and (
          public.is_adm()
          or (p.medidor_id = auth.uid() and category = 'medicao')
          or (p.projetista_id = auth.uid() and category in ('engenharia', 'obra'))
          or (p.comprador_id = auth.uid() and category = 'compras')
          or (p.montador_id = auth.uid() and category = 'assistencia')
        )
    )
  )
);

drop policy if exists "rooms_delete_adm" on public.rooms;
create policy "rooms_delete_adm"
on public.rooms
for delete
using (
  public.is_platform_admin()
  or (company_id = public.current_company_id() and public.is_adm())
);

drop policy if exists "alerts_delete_adm" on public.alerts;
create policy "alerts_delete_adm"
on public.alerts
for delete
using (
  public.is_platform_admin()
  or (company_id = public.current_company_id() and public.is_adm())
);

drop policy if exists "project_files_project_members_read" on storage.objects;
drop policy if exists "project_files_project_members_insert" on storage.objects;
drop policy if exists "project_files_project_members_update" on storage.objects;
drop policy if exists "project_files_role_category_read" on storage.objects;
drop policy if exists "project_files_role_category_insert" on storage.objects;
drop policy if exists "project_files_role_category_update" on storage.objects;
drop policy if exists "project_files_role_category_delete" on storage.objects;

create or replace function public.can_read_project_storage_path(object_name text)
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
          or (p.medidor_id = auth.uid() and (storage.foldername(object_name))[3] = 'medicao')
          or (p.projetista_id = auth.uid() and (storage.foldername(object_name))[3] in ('medicao', 'engenharia', 'obra'))
          or (p.comprador_id = auth.uid() and (storage.foldername(object_name))[3] = 'compras')
          or (p.montador_id = auth.uid() and (storage.foldername(object_name))[3] in ('obra', 'assistencia'))
          or (p.cliente_id = auth.uid() and (storage.foldername(object_name))[3] = 'obra')
        )
    ),
    false
  )
$$;

create or replace function public.can_write_project_storage_path(object_name text)
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
          or (p.medidor_id = auth.uid() and (storage.foldername(object_name))[3] = 'medicao')
          or (p.projetista_id = auth.uid() and (storage.foldername(object_name))[3] in ('engenharia', 'obra'))
          or (p.comprador_id = auth.uid() and (storage.foldername(object_name))[3] = 'compras')
          or (p.montador_id = auth.uid() and (storage.foldername(object_name))[3] = 'assistencia')
        )
    ),
    false
  )
$$;

create policy "project_files_role_category_read"
on storage.objects
for select
using (
  bucket_id = 'project-files'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = public.current_company_id()::text
  and public.can_read_project_storage_path(name)
);

create policy "project_files_role_category_insert"
on storage.objects
for insert
with check (
  bucket_id = 'project-files'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = public.current_company_id()::text
  and public.can_write_project_storage_path(name)
);

create policy "project_files_role_category_update"
on storage.objects
for update
using (
  bucket_id = 'project-files'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = public.current_company_id()::text
  and public.can_write_project_storage_path(name)
)
with check (
  bucket_id = 'project-files'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = public.current_company_id()::text
  and public.can_write_project_storage_path(name)
);

create policy "project_files_role_category_delete"
on storage.objects
for delete
using (
  bucket_id = 'project-files'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = public.current_company_id()::text
  and public.can_write_project_storage_path(name)
);

-- Remove a superficie RPC de funcoes internas. As funcoes auxiliares de RLS
-- continuam executaveis apenas por usuarios autenticados.
alter function public.touch_updated_at() set search_path = public;

drop function if exists public.can_access_project_storage_path(text);

revoke all on function public.current_profile() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.enforce_profile_update_scope() from public, anon, authenticated;
revoke all on function public.enforce_project_update_scope() from public, anon, authenticated;
revoke all on function public.enforce_room_update_scope() from public, anon, authenticated;
revoke all on function public.enforce_purchase_update_scope() from public, anon, authenticated;
revoke all on function public.enforce_project_assignments() from public, anon, authenticated;
revoke all on function public.enforce_project_child_integrity() from public, anon, authenticated;

revoke all on function public.current_company_id() from public, anon;
revoke all on function public.current_role() from public, anon;
revoke all on function public.is_adm() from public, anon;
revoke all on function public.is_platform_admin() from public, anon;
revoke all on function public.project_directory() from public, anon;
revoke all on function public.can_read_project_storage_path(text) from public, anon;
revoke all on function public.can_write_project_storage_path(text) from public, anon;

grant execute on function public.current_company_id() to authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.is_adm() to authenticated;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.project_directory() to authenticated;
grant execute on function public.can_read_project_storage_path(text) to authenticated;
grant execute on function public.can_write_project_storage_path(text) to authenticated;
