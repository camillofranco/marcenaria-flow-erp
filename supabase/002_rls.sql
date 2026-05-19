-- Regras de acesso para piloto.
-- Cada usuário enxerga somente dados da própria marcenaria.
-- ADM enxerga tudo da empresa; demais perfis enxergam o que é atribuído ao seu papel.

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.rooms enable row level security;
alter table public.purchases enable row level security;
alter table public.alerts enable row level security;
alter table public.project_files enable row level security;
alter table public.activity_log enable row level security;

create or replace function public.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.profiles
  where id = auth.uid()
    and active = true
  limit 1
$$;

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id
  from public.profiles
  where id = auth.uid()
    and active = true
  limit 1
$$;

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and active = true
  limit 1
$$;

create or replace function public.is_adm()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'adm', false)
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select platform_admin
      from public.profiles
      where id = auth.uid()
        and active = true
      limit 1
    ),
    false
  )
$$;

create policy "companies_select_own"
on public.companies
for select
using (id = public.current_company_id() or public.is_platform_admin());

create policy "companies_insert_platform_admin"
on public.companies
for insert
with check (public.is_platform_admin());

create policy "companies_update_platform_admin"
on public.companies
for update
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "profiles_select_own_company"
on public.profiles
for select
using (company_id = public.current_company_id() or public.is_platform_admin());

create policy "profiles_insert_adm_or_platform_admin"
on public.profiles
for insert
with check (
  public.is_platform_admin()
  or (
    company_id = public.current_company_id()
    and public.is_adm()
    and platform_admin = false
  )
);

create policy "profiles_update_self_or_adm"
on public.profiles
for update
using (
  public.is_platform_admin()
  or (company_id = public.current_company_id() and (id = auth.uid() or public.is_adm()))
)
with check (
  public.is_platform_admin()
  or (
    company_id = public.current_company_id()
    and (id = auth.uid() or public.is_adm())
    and platform_admin = false
  )
);

create policy "projects_select_by_role"
on public.projects
for select
using (
  public.is_platform_admin()
  or (
    company_id = public.current_company_id()
    and (
      public.is_adm()
      or medidor_id = auth.uid()
      or projetista_id = auth.uid()
      or comprador_id = auth.uid()
      or montador_id = auth.uid()
      or cliente_id = auth.uid()
    )
  )
);

create policy "projects_insert_adm"
on public.projects
for insert
with check (
  public.is_platform_admin()
  or (company_id = public.current_company_id() and public.is_adm())
);

create policy "projects_update_by_role"
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
      or comprador_id = auth.uid()
      or montador_id = auth.uid()
    )
  )
)
with check (company_id = public.current_company_id() or public.is_platform_admin());

create policy "rooms_select_project_members"
on public.rooms
for select
using (
  public.is_platform_admin()
  or (
    company_id = public.current_company_id()
    and exists (
      select 1
      from public.projects p
      where p.id = rooms.project_id
        and (
          public.is_adm()
          or p.medidor_id = auth.uid()
          or p.projetista_id = auth.uid()
          or p.montador_id = auth.uid()
          or p.cliente_id = auth.uid()
        )
    )
  )
);

create policy "rooms_insert_adm"
on public.rooms
for insert
with check (
  public.is_platform_admin()
  or (company_id = public.current_company_id() and public.is_adm())
);

create policy "rooms_update_project_members"
on public.rooms
for update
using (
  public.is_platform_admin()
  or (
    company_id = public.current_company_id()
    and exists (
      select 1
      from public.projects p
      where p.id = rooms.project_id
        and (
          public.is_adm()
          or p.medidor_id = auth.uid()
          or p.projetista_id = auth.uid()
          or p.montador_id = auth.uid()
        )
    )
  )
)
with check (company_id = public.current_company_id() or public.is_platform_admin());

create policy "purchases_select_related"
on public.purchases
for select
using (
  public.is_platform_admin()
  or (
    company_id = public.current_company_id()
    and (
      public.is_adm()
      or requested_by = auth.uid()
      or public.current_role() = 'comprador'
    )
  )
);

create policy "purchases_insert_projetista_or_adm"
on public.purchases
for insert
with check (
  public.is_platform_admin()
  or (
    company_id = public.current_company_id()
    and (public.is_adm() or public.current_role() = 'projetista')
  )
);

create policy "purchases_update_adm_or_comprador"
on public.purchases
for update
using (
  public.is_platform_admin()
  or (
    company_id = public.current_company_id()
    and (public.is_adm() or public.current_role() = 'comprador')
  )
)
with check (company_id = public.current_company_id() or public.is_platform_admin());

create policy "alerts_select_project_members"
on public.alerts
for select
using (
  public.is_platform_admin()
  or (
    company_id = public.current_company_id()
    and exists (
      select 1
      from public.projects p
      where p.id = alerts.project_id
        and (
          public.is_adm()
          or p.medidor_id = auth.uid()
          or p.projetista_id = auth.uid()
          or p.montador_id = auth.uid()
          or p.cliente_id = auth.uid()
        )
    )
  )
);

create policy "alerts_insert_project_members"
on public.alerts
for insert
with check (
  public.is_platform_admin()
  or (
    company_id = public.current_company_id()
    and exists (
      select 1
      from public.projects p
      where p.id = alerts.project_id
        and (
          public.is_adm()
          or p.projetista_id = auth.uid()
          or p.montador_id = auth.uid()
        )
    )
  )
);

create policy "alerts_update_adm"
on public.alerts
for update
using (
  public.is_platform_admin()
  or (company_id = public.current_company_id() and public.is_adm())
)
with check (company_id = public.current_company_id() or public.is_platform_admin());

create policy "files_select_project_members"
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
          or p.medidor_id = auth.uid()
          or p.projetista_id = auth.uid()
          or p.comprador_id = auth.uid()
          or p.montador_id = auth.uid()
          or p.cliente_id = auth.uid()
        )
    )
  )
);

create policy "files_insert_project_members"
on public.project_files
for insert
with check (company_id = public.current_company_id() or public.is_platform_admin());

create policy "activity_log_select_adm"
on public.activity_log
for select
using (
  public.is_platform_admin()
  or (company_id = public.current_company_id() and public.is_adm())
);

create policy "activity_log_insert_authenticated"
on public.activity_log
for insert
with check (company_id = public.current_company_id() or public.is_platform_admin());
