# Operação Do Piloto Real

Este documento descreve o que precisa acontecer para usar o Marcenaria Flow ERP em uma primeira marcenaria real.

## Objetivo Do Piloto

Validar o fluxo operacional com dados reais, usuários reais e projetos reais, antes de transformar o sistema em um SaaS profissional.

O piloto não deve tentar resolver toda a marcenaria de uma vez. Ele deve provar que o fluxo central funciona:

- ADM abre projeto.
- Medidor registra medição.
- Projetista inicia e conclui ambientes.
- Projetista solicita compra.
- ADM aprova compra.
- Comprador atualiza suprimentos.
- Montador consulta arquivos, alertas e checklist.
- Pendências voltam para o ADM.

## Escopo Inicial

Usar entre 3 e 5 projetos reais da marcenaria.

Perfis mínimos:

- 1 ADM.
- 1 medidor.
- 1 projetista.
- 1 comprador.
- 1 montador.

Se a marcenaria for pequena e uma pessoa acumular funções, o mesmo usuário pode representar mais de um papel na fase de teste. Na versão final, isso deve virar permissão multi-perfil.

## Antes De Começar

Coletar com a marcenaria:

- Nome da empresa.
- Nome e e-mail dos usuários.
- Função de cada usuário.
- Lista de 3 a 5 projetos reais.
- Ambientes de cada projeto.
- Data prevista de montagem.
- Endereço completo.
- Padrão atual de armazenamento de arquivos.
- Principais problemas que eles querem eliminar.

Usar o arquivo `data/projetos_piloto_template.csv` como base de coleta.

## Infraestrutura Do Piloto

O piloto publicado agora usa:

- Supabase Postgres para banco de dados.
- Supabase Auth para login.
- Supabase Row Level Security para separar perfis e empresa.
- Supabase Storage preparado para arquivos e fotos.
- Vercel para publicação do frontend e função segura de criação de usuários.

Alternativa temporária:

- Google Sheets para coleta inicial.
- Google Drive para arquivos.
- MVP web como painel de validação.

Para piloto real com múltiplos usuários, não operar apenas em `localStorage`.

## Configuração Supabase

1. Projeto Supabase criado.
2. Scripts aplicados nesta ordem:
   - `supabase/001_schema.sql`
   - `supabase/002_rls.sql`
   - `supabase/003_storage.sql`
   - `supabase/004_seed_pilot.sql`
   - `supabase/005_profiles_phone.sql`
3. Usuário técnico/ADM criado.
4. Primeiro ADM real deve ser criado pelo app em `Nova pessoa`.
5. A partir dele, o próprio cliente cadastra equipe e clientes.

## Configuração Vercel

1. Repositório conectado: `camillofranco/marcenaria-flow-erp`.
2. Build command: vazio.
3. Publish directory: `.`.
4. Framework: `Other`.
5. Site publicado: `https://marcenaria-flow-erp.vercel.app`.
6. Variáveis de produção obrigatórias:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
7. A função segura fica em `/api/create-user`.

O app publicado já usa Supabase para login, cadastro de pessoas e dados operacionais. A tela pública não exibe modo demonstração.

## Segurança Pós-Implantação

Depois de validar o acesso publicado:

- Revogar o Supabase access token usado na implantação.
- Rotacionar a chave `service_role` e atualizar a variável `SUPABASE_SERVICE_ROLE_KEY` no Vercel.
- Revogar tokens pessoais antigos de implantação.
- Alterar a senha do usuário técnico/ADM.
- Criar o ADM real do cliente e operar o dia a dia por esse acesso.

## Rotina Do Piloto

### Dia 1: Implantação

- Cadastrar usuários.
- Cadastrar projetos reais.
- Explicar os cinco perfis.
- Validar acesso em celular e computador.
- Definir quem registra feedback.

### Dias 2 A 5: Uso Assistido

- Acompanhar cada etapa.
- Anotar dúvidas e travas.
- Registrar campos ausentes.
- Ver se o montador consegue usar em obra.
- Ver se o ADM entende os alertas.

### Dia 6 Ou 7: Revisão

- Reunião curta com a equipe.
- Separar problemas de processo e problemas de sistema.
- Priorizar ajustes.
- Definir escopo da versão SaaS.

## Indicadores Do Piloto

Medir:

- Quantos projetos foram cadastrados.
- Quantos ambientes foram acompanhados.
- Quantas compras foram solicitadas.
- Quantos alertas críticos foram criados.
- Quantas pendências de montagem foram reportadas.
- Tempo entre solicitação e aprovação de compra.
- Tempo entre pendência e ciência do ADM.

## Critério De Aprovação

O piloto pode avançar para versão SaaS se:

- O cliente confirmar que o fluxo representa a rotina real.
- Os usuários conseguirem usar sem treinamento pesado.
- O ADM perceber ganho de controle.
- O montador conseguir consultar informações na obra.
- A equipe identificar redução de ruído entre setores.

## Próximas Entregas Técnicas

Prioridade 1:

- Login real.
- Banco compartilhado.
- Cadastro real de projetos.
- Upload de fotos e arquivos.
- Permissões por perfil.

Prioridade 2:

- Histórico de atividades.
- Notificações por e-mail ou WhatsApp.
- Relatórios.
- Multiempresa.
- Painel financeiro de compras.

Prioridade 3:

- Plano SaaS.
- Gestão de assinatura.
- Onboarding automático.
- Templates por tipo de marcenaria.
