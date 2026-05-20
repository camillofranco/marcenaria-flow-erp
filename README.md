# Marcenaria Flow ERP

ERP web/mobile para marcenarias acompanharem projetos do inicio ao fim: abertura do projeto, medicao tecnica, desenvolvimento, compras, arquivos de obra, montagem, alertas e assistencia.

O projeto esta em fase de piloto real com uma primeira marcenaria. A proposta atual e validar o fluxo operacional com usuarios reais antes de evoluir para um SaaS profissional.

## URL De Producao

Aplicacao publicada:

https://marcenaria-flow-erp.vercel.app

Repositorio:

https://github.com/camillofranco/marcenaria-flow-erp

## Objetivo Do Produto

Centralizar a operacao de uma marcenaria em um unico portal, reduzindo informacao perdida em WhatsApp, fotos soltas, pedidos de compra sem rastreio e falhas de comunicacao entre medidor, projetista, comprador, montador, administrador e cliente final.

O sistema foi desenhado para responder perguntas praticas do dia a dia:

- Qual projeto esta em qual etapa?
- Quem e o responsavel por cada fase?
- Quais ambientes ja foram medidos, projetados ou montados?
- Que compras foram solicitadas e aprovadas?
- Quais alertas criticos a montagem precisa saber?
- O cliente consegue acompanhar o andamento sem ver informacoes internas?
- O ADM consegue identificar pendencias rapidamente?

## Perfis De Acesso

O sistema usa login real via Supabase Auth e aplica permissoes por perfil.

### Administrador

- Visualiza todos os dados da empresa.
- Cria projetos.
- Cadastra, altera e exclui usuarios.
- Vincula responsaveis aos projetos.
- Aprova compras.
- Visualiza alertas e assistencias.
- Pode validar o comportamento dos demais perfis durante o piloto.

### Medidor

- Visualiza apenas projetos em que esta vinculado.
- Acompanha ambientes da obra.
- Registra/simula fotos de medicao por ambiente.
- Libera o projeto para desenvolvimento.

### Projetista

- Visualiza apenas projetos em que esta vinculado.
- Inicia o desenvolvimento tecnico.
- Marca checklist de ambientes concluidos.
- Solicita materiais especiais para compra.
- Registra/simula arquivos de engenharia e obra.

### Comprador

- Visualiza projetos vinculados ao seu usuario.
- Acompanha itens aprovados pelo ADM.
- Atualiza status de compra.
- Registra/simula faturas e comprovantes.

### Montador

- Visualiza apenas obras em que esta vinculado.
- Abre rota do endereco no Google Maps.
- Consulta arquivos de obra.
- Ve alertas criticos.
- Marca checklist de montagem.
- Relata pendencias e assistencias.

### Cliente

- Visualiza apenas projetos vinculados ao seu e-mail.
- Acompanha status, previsao de montagem e arquivos liberados.
- Nao acessa compras, alertas internos ou dados de gestao.

## Fluxo Operacional

1. O ADM cria o projeto com numero, cliente, endereco, data de montagem, ambientes e responsaveis.
2. O medidor acessa o projeto vinculado e registra a medicao por ambiente.
3. O projetista inicia o desenvolvimento, acompanha ambientes e solicita compras quando necessario.
4. O ADM aprova ou controla as compras solicitadas.
5. O comprador executa a compra e atualiza o status.
6. O montador acessa rota, arquivos de obra, alertas e checklist.
7. O cliente acompanha o andamento do projeto pelo proprio acesso.
8. Pendencias de montagem geram alerta para o ADM.

## Stack Tecnica

- Frontend: HTML, CSS e JavaScript puro.
- Auth: Supabase Auth.
- Banco: Supabase Postgres.
- Permissoes: Supabase Row Level Security.
- API administrativa: Vercel Serverless Functions.
- Deploy: Vercel.
- Webapp/PWA: manifest, theme color, apple mobile tags e service worker basico.

## Estrutura Do Projeto

```text
.
├── index.html
├── styles.css
├── app.js
├── manifest.webmanifest
├── sw.js
├── vercel.json
├── api/
│   ├── create-user.js
│   └── manage-user.js
├── assets/
│   ├── favicon.png
│   ├── flow-marcenaria-logo.png
│   └── login-background.jpg
├── docs/
│   ├── BACKLOG_TECNICO.md
│   ├── GUIA_RAPIDO_CLIENTE_PILOTO.md
│   ├── OPERACAO_PILOTO_REAL.md
│   ├── ROADMAP_SAAS.md
│   ├── SUPABASE_BOOTSTRAP.md
│   └── SUPABASE_PROJECT.md
└── supabase/
    ├── 001_schema.sql
    ├── 002_rls.sql
    ├── 003_storage.sql
    ├── 004_seed_pilot.sql
    └── 005_profiles_phone.sql
```

## Funcionalidades Implementadas

- Login real com Supabase.
- Tela de login profissional com imagem de fundo, logo e favicon.
- Recuperacao de senha conectada ao Supabase Auth.
- Alteracao de senha pelo usuario logado.
- Perfis ADM, Medidor, Projetista, Comprador, Montador e Cliente.
- Filtro de projetos por vinculo do usuario.
- Cadastro real de usuarios pelo ADM.
- Alteracao e exclusao/desativacao de usuarios pelo ADM.
- Criacao de projetos pelo ADM.
- Vinculo de medidor, projetista, comprador, montador e cliente ao projeto.
- Cards de projetos por status.
- Busca por projeto, cliente ou endereco.
- Metricas operacionais.
- Checklist de ambientes.
- Lista de compras com aprovacao/status.
- Alertas por criticidade.
- Simulacao de estrutura de arquivos por projeto.
- Tour guiado por perfil de usuario.
- Layout responsivo mobile-first.
- Instalacao como webapp/PWA.

## Estado Do Piloto

O sistema esta pronto para um piloto real controlado, com cliente testando:

- Login e acesso por perfil.
- Criacao de usuarios.
- Criacao de projetos reais.
- Vinculo de responsaveis.
- Visualizacao por permissao.
- Fluxo de medicao, projeto, compra e montagem.
- Acompanhamento pelo cliente.
- Experiencia mobile/webapp.

O piloto ainda nao deve ser vendido como SaaS final. Ele deve ser apresentado como validacao operacional para colher feedback real da marcenaria.

## Limitacoes Atuais

- Upload real de arquivos ainda nao esta finalizado.
- Fotos e arquivos estao representados no fluxo, mas ainda precisam de integracao definitiva com Supabase Storage ou Google Drive.
- Notificacoes push/e-mail ainda nao estao implementadas como automacao completa.
- Recuperacao de senha depende da configuracao correta de e-mail/SMTP e redirect URLs no Supabase.
- Ainda nao ha painel financeiro completo para compras.
- Ainda nao ha multiempresa comercial com onboarding self-service.

## Proximos Passos Tecnicos

1. Configurar URLs e e-mail transacional do Supabase Auth.
2. Implementar upload real para Supabase Storage ou Google Drive.
3. Criar automacoes de notificacao para ADM, comprador e montador.
4. Criar fluxo de convite de usuarios por e-mail.
5. Melhorar auditoria de eventos.
6. Criar dashboard de saude do piloto.
7. Evoluir multiempresa, planos e cobranca para SaaS.

## Como Rodar Localmente

Na raiz do projeto:

```bash
python3 -m http.server 4173
```

Depois acesse:

```text
http://localhost:4173
```

Observacao: algumas funcionalidades reais dependem do ambiente publicado ou das variaveis de ambiente da Vercel, especialmente APIs administrativas.

## Variaveis De Ambiente

Na Vercel, configure:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Nunca versionar chaves sensiveis no repositorio.

## Deploy

Deploy manual:

```bash
npx vercel --prod --yes
```

Arquivos relevantes:

- `vercel.json`: headers e rewrites.
- `api/create-user.js`: criacao de usuario pelo ADM.
- `api/manage-user.js`: alteracao e exclusao/desativacao de usuario pelo ADM.

## Supabase

Scripts principais:

- `supabase/001_schema.sql`: tipos, tabelas e indices.
- `supabase/002_rls.sql`: politicas RLS por empresa/perfil/vinculo.
- `supabase/003_storage.sql`: bucket de arquivos.
- `supabase/004_seed_pilot.sql`: seed inicial.
- `supabase/005_profiles_phone.sql`: campo de telefone em perfis.

Regras importantes:

- ADM visualiza a empresa inteira.
- Usuario comum ve apenas projetos em que esta vinculado.
- Cliente ve apenas projeto vinculado ao proprio perfil.
- Criacao/gestao de usuarios passa por API serverless com service role protegida.

## Guia Para Teste Com Cliente

Antes da reuniao:

1. Criar o ADM real da marcenaria.
2. Criar usuarios de cada perfil.
3. Criar pelo menos um projeto real.
4. Vincular cada responsavel ao projeto.
5. Testar login de ADM, medidor, projetista, comprador, montador e cliente.
6. Abrir pelo celular e adicionar a tela inicial.

Durante o teste, pedir feedback sobre:

- Clareza do fluxo.
- Nomes das etapas.
- Campos obrigatorios.
- Perfis e permissoes.
- Rotina de medicao.
- Rotina de compras.
- Rotina de montagem.
- Visao do cliente final.
- Uso no celular em obra.

## Documentacao Complementar

- `PILOTO_CLIENTE_MARCENARIA.md`: apresentacao executiva do piloto.
- `docs/GUIA_RAPIDO_CLIENTE_PILOTO.md`: guia rapido de uso.
- `docs/OPERACAO_PILOTO_REAL.md`: plano de operacao no cliente.
- `docs/ROADMAP_SAAS.md`: caminho para evoluir para SaaS.
- `docs/BACKLOG_TECNICO.md`: backlog tecnico.
- `docs/SUPABASE_BOOTSTRAP.md`: bootstrap dos primeiros usuarios.
- `docs/SUPABASE_PROJECT.md`: dados nao sensiveis do projeto Supabase.

## Status

Piloto real publicado e pronto para coleta de feedback com uma marcenaria.

Proxima fase: transformar os aprendizados do piloto em funcionalidades finais de SaaS.
