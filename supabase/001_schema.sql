-- Marcenaria Flow ERP
-- Schema inicial para piloto real em Supabase/Postgres.

create extension if not exists "pgcrypto";

create type public.user_role as enum (
  'adm',
  'medidor',
  'projetista',
  'comprador',
  'montador',
  'cliente'
);

create type public.project_status as enum (
  'abertura',
  'medicao',
  'desenvolvimento',
  'compras',
  'fabrica',
  'montagem',
  'assistencia',
  'concluido',
  'cancelado'
);

create type public.purchase_approval as enum (
  'pendente',
  'aprovado',
  'recusado',
  'revisao'
);

create type public.purchase_status as enum (
  'aguardando',
  'cotando',
  'comprado',
  'entregue',
  'cancelado'
);

create type public.alert_level as enum (
  'critical',
  'attention',
  'info'
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text not null,
  email text not null,
  role public.user_role not null,
  platform_admin boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, email)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_number text not null,
  client_name text not null,
  client_phone text,
  address text not null,
  install_date date not null,
  status public.project_status not null default 'abertura',
  medidor_id uuid references public.profiles(id),
  projetista_id uuid references public.profiles(id),
  comprador_id uuid references public.profiles(id),
  montador_id uuid references public.profiles(id),
  cliente_id uuid references public.profiles(id),
  started_design_at timestamptz,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, project_number)
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  measurement_notes text,
  measurement_photos_count integer not null default 0,
  design_done boolean not null default false,
  install_done boolean not null default false,
  support_note text,
  support_open boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  material text not null,
  quantity text not null,
  requested_by uuid references public.profiles(id),
  approval public.purchase_approval not null default 'pendente',
  purchase_status public.purchase_status not null default 'aguardando',
  supplier text,
  estimated_cost numeric(12, 2),
  invoice_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  level public.alert_level not null,
  title text not null,
  description text,
  created_by uuid references public.profiles(id),
  resolved boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  category text not null check (category in ('medicao', 'engenharia', 'obra', 'compras', 'assistencia')),
  file_name text not null,
  storage_bucket text not null default 'project-files',
  storage_path text not null,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index projects_company_status_idx on public.projects(company_id, status);
create index rooms_project_idx on public.rooms(project_id);
create index purchases_project_idx on public.purchases(project_id);
create index purchases_company_approval_idx on public.purchases(company_id, approval);
create index alerts_project_idx on public.alerts(project_id);
create index alerts_company_level_idx on public.alerts(company_id, level, resolved);
create index files_project_idx on public.project_files(project_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_touch_updated_at
before update on public.companies
for each row execute function public.touch_updated_at();

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger projects_touch_updated_at
before update on public.projects
for each row execute function public.touch_updated_at();

create trigger rooms_touch_updated_at
before update on public.rooms
for each row execute function public.touch_updated_at();

create trigger purchases_touch_updated_at
before update on public.purchases
for each row execute function public.touch_updated_at();

create trigger alerts_touch_updated_at
before update on public.alerts
for each row execute function public.touch_updated_at();
