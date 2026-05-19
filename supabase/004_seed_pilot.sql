-- Seed de estrutura inicial.
-- Ajustar e-mails antes de rodar com usuários reais criados no Supabase Auth.
-- Como profiles.id referencia auth.users(id), crie os usuários primeiro e substitua os UUIDs abaixo.

insert into public.companies (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'Marcenaria Piloto', 'marcenaria-piloto')
on conflict (slug) do update set name = excluded.name;

-- Exemplo de usuários. Substituir UUIDs pelos IDs reais em auth.users.
-- insert into public.profiles (id, company_id, full_name, email, role)
-- values
--   ('UUID_AUTH_ADM', '00000000-0000-0000-0000-000000000001', 'Administrador', 'admin@cliente.com', 'adm'),
--   ('UUID_AUTH_MEDIDOR', '00000000-0000-0000-0000-000000000001', 'Medidor', 'medidor@cliente.com', 'medidor'),
--   ('UUID_AUTH_PROJETISTA', '00000000-0000-0000-0000-000000000001', 'Projetista', 'projetista@cliente.com', 'projetista'),
--   ('UUID_AUTH_COMPRADOR', '00000000-0000-0000-0000-000000000001', 'Comprador', 'comprador@cliente.com', 'comprador'),
--   ('UUID_AUTH_MONTADOR', '00000000-0000-0000-0000-000000000001', 'Montador', 'montador@cliente.com', 'montador'),
--   ('UUID_AUTH_CLIENTE', '00000000-0000-0000-0000-000000000001', 'Cliente', 'cliente@cliente.com', 'cliente');

-- Usuário técnico/fantasma do programador.
-- 1. Crie seu usuário em Authentication.
-- 2. Copie o UUID.
-- 3. Substitua UUID_AUTH_PROGRAMADOR abaixo e rode este insert uma única vez.
-- 4. Esse usuário consegue criar a empresa piloto e o primeiro ADM real.
--
-- insert into public.profiles (id, company_id, full_name, email, role, platform_admin)
-- values (
--   'UUID_AUTH_PROGRAMADOR',
--   '00000000-0000-0000-0000-000000000001',
--   'Programador Marcenaria Flow',
--   'seu-email@dominio.com',
--   'adm',
--   true
-- );
