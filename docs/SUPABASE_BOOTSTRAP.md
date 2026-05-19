# Bootstrap Supabase

Este documento define o modelo correto de acesso para sair do MVP local.

## Papéis

### Platform Admin

É o usuário técnico do programador.

Uso:

- Criar e validar a primeira empresa.
- Criar o primeiro ADM real do cliente.
- Corrigir dados em implantação.
- Dar suporte técnico.

Esse usuário não deve representar a marcenaria. Ele é um usuário fantasma/técnico de plataforma.

No banco, ele fica em `profiles` com:

- `role = 'adm'`
- `platform_admin = true`

### ADM Do Cliente

É o primeiro acesso real da marcenaria.

Uso:

- Cadastrar usuários da empresa.
- Criar projetos.
- Atribuir responsáveis.
- Aprovar compras.
- Acompanhar alertas e assistências.

No banco, ele fica em `profiles` com:

- `role = 'adm'`
- `platform_admin = false`

### Usuários Da Marcenaria

Criados pelo ADM do cliente:

- `medidor`
- `projetista`
- `comprador`
- `montador`
- `cliente`

## Regra Principal

Somente dois tipos de usuário podem cadastrar acessos:

- Platform Admin.
- ADM real da empresa.

Usuários operacionais não criam outros acessos.

## Ordem De Criação

1. Criar projeto Supabase.
2. Rodar `supabase/001_schema.sql`.
3. Rodar `supabase/002_rls.sql`.
4. Rodar `supabase/003_storage.sql`.
5. Criar usuário do programador em Authentication.
6. Inserir esse usuário em `profiles` como `platform_admin = true`.
7. Criar empresa piloto em `companies`.
8. Criar usuário ADM real do cliente em Authentication.
9. Inserir esse usuário em `profiles` como `role = 'adm'`.
10. A partir daí, o ADM real cadastra os demais usuários.

## O Que Ainda Falta No Frontend

O frontend publicado ainda usa cadastro local para o piloto visual.

Para virar operação real com Supabase:

- Implementar login Supabase Auth.
- Trocar cadastro local de pessoas por criação de usuários reais.
- Criar uma Edge Function para convite/criação de usuários usando service role.
- Bloquear criação de usuários para quem não for ADM.
- Trocar `localStorage` por tabelas Supabase.

## Por Que Usar Edge Function Para Criar Usuários

O frontend não pode carregar a `service_role_key`, porque ela dá acesso administrativo ao banco.

O fluxo correto é:

1. ADM preenche dados do novo usuário.
2. Frontend chama uma Edge Function.
3. Edge Function verifica se o solicitante é ADM.
4. Edge Function usa service role para criar o usuário no Auth.
5. Edge Function cria o profile na empresa correta.

