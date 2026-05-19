# Projeto Supabase

Projeto criado para o piloto real do Marcenaria Flow.

## Dados Do Projeto

- Nome: `marcenaria-flow`
- Project ref: `oouxuleswyfjqfczlouh`
- Região: `sa-east-1`
- Dashboard: `https://supabase.com/dashboard/project/oouxuleswyfjqfczlouh`
- API URL: `https://oouxuleswyfjqfczlouh.supabase.co`
- Empresa seed: `Marcenaria Piloto`
- Company ID seed: `00000000-0000-0000-0000-000000000001`
- Bucket: `project-files`

## Scripts Aplicados

Aplicados com sucesso:

- `supabase/001_schema.sql`
- `supabase/002_rls.sql`
- `supabase/003_storage.sql`
- `supabase/004_seed_pilot.sql`

## Segurança

Não commitar:

- Supabase access token.
- Senha do banco.
- Service role key.
- Arquivo `.env`.
- Arquivos em `supabase/.temp/`.

O frontend pode usar apenas a chave pública/anon/publishable.

## Próximo Passo

Criar os usuários em Supabase Auth:

1. Usuário técnico do programador.
2. Primeiro ADM real do cliente.

Depois inserir os registros correspondentes em `public.profiles`, conforme `docs/SUPABASE_BOOTSTRAP.md`.

