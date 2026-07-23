# QA E Auditoria De Seguranca

Ultima revisao: 2026-07-23

Aplicacao: Marcenaria Flow ERP

URL: https://marcenaria-flow-erp.vercel.app

## Escopo

Esta auditoria cobre o estado atual do piloto:

- Frontend web/mobile.
- APIs serverless na Vercel.
- Headers HTTP.
- Service worker/PWA.
- Supabase Auth.
- Supabase Postgres/RLS.
- Supabase Storage privado.
- Riscos de exposicao de dados sensiveis.

Nao substitui um pentest profissional, mas serve como checklist tecnico para reduzir risco antes do piloto real com cliente.

## Referencias Tecnicas

- Supabase Production Checklist: RLS, Security Advisor, SSL, MFA, SMTP, rate limits e backups.
- Supabase API Keys: chaves secretas/service role nunca devem ir para frontend, repositorio, chat ou logs.
- Supabase Securing your API: grants e RLS precisam trabalhar juntos.
- OWASP ASVS: autenticacao, sessao, controle de acesso, validacao, encoding, protecao de dados e configuracao.
- Vercel Security Headers/HSTS: plataforma ja envia HSTS em producao; o app adiciona headers complementares.

## Resultado Executivo

O sistema esta apto para piloto real controlado, mas ainda nao deve ser tratado como SaaS final.

Classificacao atual apos as correcoes deste ciclo:

- Risco para piloto controlado: baixo, desde que os segredos compartilhados sejam rotacionados.
- Risco para operacao comercial/SaaS: alto ate concluir itens pendentes.
- Prioridade antes de escalar clientes: rotacionar segredos ja compartilhados fora de canal seguro, configurar Auth/SMTP/MFA, ativar monitoramento e ampliar testes automatizados por perfil.

## Reauditoria De 23/07/2026

Correcoes adicionais aplicadas:

- Login validado novamente em producao.
- Logout agora remove projetos, pessoas e identificadores do DOM/estado local.
- Perfil inativo ou incompleto nao deixa uma sessao parcialmente aberta.
- Senha inicial e alteracao de senha exigem no minimo 10 caracteres, com letra maiuscula, minuscula e numero, em paridade com o Supabase Auth.
- Reautenticacao para troca de senha sensivel esta habilitada no Supabase Auth.
- A verificacao de senhas vazadas (HaveIBeenPwned) exige plano Supabase Pro e permanece como pendencia externa enquanto o projeto estiver no plano gratuito.
- Dados pessoais de perfis ficaram restritos ao proprio usuario e ao ADM.
- Diretorio operacional por projeto expoe apenas nome, papel e identificadores necessarios.
- Campos de projeto, ambiente e compra passaram a ser limitados por papel no banco.
- Comprador ve apenas compras aprovadas e nao consegue alterar aprovacao.
- Cliente acessa apenas arquivos da categoria Obra.
- Storage separa leitura e escrita por papel e categoria.
- Integridade entre empresa, projeto, ambiente e arquivos e validada por triggers.
- ADM pode excluir projeto e alerta de forma real.
- Edicao de projeto remove ambientes retirados do formulario.
- Fotos, arquivos tecnicos e faturas usam upload real no bucket privado.
- Solicitacao de compra, aprovacao, recusa e status passaram a operar por item.
- Pendencia do montador agora registra ambiente, prioridade e descricao reais.
- Uploads foram limitados a 20 MB e tipos esperados; SVG nao e aceito como imagem.
- APIs administrativas ganharam rollback compensatorio para evitar Auth e perfil divergentes.

Validacoes executadas:

- 30 testes automatizados de RBAC com usuarios temporarios dos seis perfis.
- Ciclo administrativo de usuario validado pela API publicada: criar, alterar, desativar e bloquear novo login.
- Teste real de criacao e edicao de projeto, remocao de ambiente e criacao de alerta.
- Teste de cancelamento sem validacao nos formularios de projeto, pessoa e alerta.
- Testes visuais em 390x844, 768x1024 e desktop, sem overflow horizontal.
- Limpeza confirmada de empresas, usuarios e projetos temporarios de QA.
- Security Advisor reexecutado: nenhum erro critico; restam sete avisos esperados para funcoes `security definer` usadas pelo RLS e um aviso de protecao contra senhas vazadas, recurso disponivel no plano Supabase Pro.

## Correcoes Aplicadas Nesta Auditoria

### Headers HTTP

Adicionado em `vercel.json`:

- `Content-Security-Policy`.
- `Permissions-Policy`.
- `Cache-Control: no-store` para `/api/*`.
- Mantidos `X-Frame-Options`, `X-Content-Type-Options` e `Referrer-Policy`.

Objetivo:

- Reduzir risco de XSS.
- Remover dependencia de script externo/CDN para login.
- Bloquear framing/clickjacking.
- Reduzir permissao de APIs sensiveis do navegador.
- Evitar cache indevido em respostas administrativas.

### Service Worker

Arquivo: `sw.js`

Antes:

- O service worker podia tentar cachear qualquer GET que passasse pelo escopo, incluindo requisicoes que nao fossem apenas assets do shell.

Agora:

- Cache restrito a mesma origem.
- Cache restrito a shell/arquivos estaticos.
- `/api/*` nunca e cacheado.
- Chamadas externas, como Supabase, nao sao cacheadas pelo service worker.
- Biblioteca do Supabase e cacheada como asset local versionado para reduzir falhas de login em mobile/PWA.

### Login Mobile E Tablet

Arquivos:

- `index.html`
- `styles.css`
- `app.js`
- `assets/vendor/supabase.min.js`

Melhorias:

- Supabase JS deixou de depender de CDN externo.
- CSP passou a permitir scripts apenas de `self`.
- Tela de login passou a respeitar `safe-area` de iOS/Android.
- Card de login ficou mais transparente, com fallback para `100vh` e `100dvh`.
- Validado em Chrome headless com perfis desktop, iPhone 13 e iPad.

### APIs Administrativas

Arquivos:

- `api/create-user.js`
- `api/manage-user.js`
- `api/manage-file.js`

Melhorias:

- `Cache-Control: no-store`.
- Parsing mais estrito de `Authorization: Bearer`.
- Normalizacao de e-mail.
- Validacao basica de e-mail.
- Validacao de UUID para alteracao/exclusao de usuarios.
- Limite de tamanho para campos textuais.
- Perfil solicitante precisa estar ativo.
- Operacoes de arquivo exigem JWT e vinculo ao projeto.

### XSS/HTML Injection

Arquivo: `app.js`

Melhorias:

- Adicionados helpers `escapeHtml` e `escapeAttr`.
- Campos vindos de usuarios/projetos/ambientes/compras/alertas/arquivos passaram a ser escapados nos principais pontos renderizados via `innerHTML`.

### Superficie Legada E Residuos Locais

Removidos/limpos arquivos legados ou residuos locais:

- `.netlify/`
- `.vercel/`
- `supabase/.temp/`
- `marcenaria-flow-erp.zip`
- `netlify/`

Motivo:

- A producao esta na Vercel.
- Manter funcao administrativa duplicada aumenta superficie de erro e confusao operacional.

### RLS E Storage

Migracoes criadas e aplicadas no Supabase:

- `supabase/003_storage.sql`
- `supabase/006_security_hardening.sql`

Ela endurece:

- Visualizacao de compras por membros do projeto.
- Atualizacao de compras por ADM ou comprador vinculado.
- Insercao de arquivos por membros do projeto.
- Storage privado por `company_id` e `project_id`, nao apenas por empresa.
- Bucket `project-files` privado, com politicas de leitura/escrita por vinculo.

### Smoke Test De Seguranca

Criado script:

- `scripts/security-smoke.mjs`

Ele valida:

- Headers de seguranca em producao.
- APIs administrativas bloqueando GET.
- `Cache-Control: no-store` nas APIs.
- Manifest PWA disponivel.
- Service worker sem cache de `/api/*`.
- API de arquivos bloqueando GET e usando `no-store`.
- CSP sem dependencia de CDN de scripts.
- Supabase JS local no cache do shell.

## Achados Por Severidade

### Critico

#### Segredos compartilhados fora de canal seguro

Houve compartilhamento previo de tokens/senhas no fluxo de trabalho. Mesmo que nao estejam versionados, devem ser tratados como potencialmente comprometidos.

Acao obrigatoria:

- Rotacionar Supabase service role/secret key.
- Rotacionar Supabase access token pessoal.
- Alterar senha do usuario admin tecnico.
- Revisar variaveis de ambiente na Vercel.
- Remover tokens antigos depois da troca.

### Alto

#### Recuperacao de senha depende de configuracao externa

O botao esta implementado, mas Supabase Auth precisa estar configurado.

Acao:

- Configurar Site URL.
- Configurar Redirect URLs.
- Configurar SMTP proprio.
- Ajustar rate limits.
- Avaliar CAPTCHA/bot protection.

#### Falta protecao anti-abuso nas APIs administrativas

As APIs exigem JWT e ADM, mas ainda nao ha rate limit proprio por IP/usuario.

Acao recomendada:

- Ativar protecoes de plataforma/WAF.
- Usar Vercel/Cloudflare para rate limit.
- Registrar eventos administrativos no `activity_log`.

#### Upload real exige teste operacional com cliente

O app possui fluxo de arquivos e storage privado, mas o primeiro uso real deve ser acompanhado de perto em obra.

Acao:

- Assinar URLs temporarias quando necessario.
- Bloquear acesso publico.
- Testar leitura por cada perfil.

### Medio

#### Sem monitoramento operacional

Ainda falta painel/logs de erro e alertas de seguranca.

Acao:

- Registrar acoes administrativas.
- Registrar falhas de login relevantes via Supabase/Vercel.
- Criar rotina de revisao semanal durante piloto.

#### Cobertura automatizada ainda nao e completa

Existem smoke tests de seguranca e RBAC, mas ainda falta uma suite continua de UI executada no CI.

Acao:

- Automatizar os fluxos de navegador no GitHub Actions.
- Manter a matriz de permissao atualizada ao criar novas funcoes.

#### PWA com cache do shell

O service worker foi restringido, mas cache ainda deve ser monitorado durante updates.

Acao:

- Versionar cache a cada deploy relevante.
- Garantir que dados sensiveis nunca sejam gravados em cache local.

### Baixo

#### README e docs ainda estao em ASCII

Nao e risco de seguranca. Foi mantido para consistencia tecnica.

## Checklist QA Funcional

### Login

- [x] Login ADM tecnico.
- [ ] Login ADM cliente.
- [ ] Login medidor.
- [ ] Login projetista.
- [ ] Login comprador.
- [ ] Login montador.
- [ ] Login cliente.
- [x] Logout limpa a sessao visual e os dados carregados.
- [ ] Alterar senha funciona para usuario logado.
- [ ] Recuperacao de senha envia e-mail depois de configurar SMTP/redirect.

### Usuarios

- [x] ADM cria usuario.
- [x] ADM altera usuario.
- [x] ADM desativa/exclui usuario sem vinculo.
- [x] ADM nao exclui proprio usuario.
- [ ] Usuario comum nao ve tela Pessoas.
- [x] Usuario comum nao chama API administrativa com sucesso.

### Projetos

- [x] ADM cria projeto real.
- [ ] Projeto exige campos obrigatorios.
- [x] Cancelar modal nao exige preenchimento.
- [ ] Responsaveis aparecem nos selects.
- [x] Busca filtra projeto/cliente/endereco.
- [x] Status visual correto.

### Permissoes

- [x] ADM ve todos os projetos da empresa.
- [x] Medidor ve apenas projetos vinculados.
- [x] Projetista ve apenas projetos vinculados.
- [x] Comprador ve apenas projetos vinculados e compras aprovadas.
- [x] Montador ve apenas projetos vinculados.
- [x] Cliente ve apenas o proprio projeto.
- [x] Usuario sem vinculo nao ve projetos.

### Fluxo

- [x] Medidor envia fotos reais e libera projeto.
- [x] Projetista da start, marca checklist e solicita compra.
- [x] ADM aprova ou recusa compra.
- [x] Comprador atualiza status e anexa fatura real.
- [ ] Montador abre rota e registra pendencia.
- [ ] ADM ve alerta critico.
- [ ] Cliente acompanha status sem informacoes internas.

### Mobile/Webapp

- [x] Login legivel no celular.
- [x] Sidebar/nav utilizavel no celular apos login real.
- [x] Cards nao estouram largura apos login real.
- [x] Modais funcionam no celular.
- [ ] Tour nao sobrepoe controles importantes.
- [ ] App pode ser adicionado a tela inicial.

## Checklist Cyberseguranca Antes Do Cliente

- [ ] Rotacionar segredos compartilhados fora de canal seguro.
- [x] Aplicar `supabase/006_security_hardening.sql`.
- [x] Aplicar `supabase/007_rbac_integrity.sql`.
- [ ] Revisar Supabase Security Advisor.
- [ ] Revisar Supabase Performance Advisor.
- [x] Confirmar RLS e escopo de campos nas tabelas operacionais.
- [x] Confirmar bucket `project-files` privado.
- [ ] Configurar Auth Site URL e Redirect URLs.
- [ ] Configurar SMTP proprio.
- [ ] Configurar MFA na conta Supabase e GitHub.
- [ ] Configurar acesso da Vercel com 2FA.
- [ ] Revisar variaveis de ambiente na Vercel.
- [x] Fazer teste de usuario comum tentando acessar dados de outro perfil.
- [x] Fazer teste de API administrativa sem token e com usuario nao ADM.

## Comandos De Validacao Local

```bash
node --check app.js
node --check api/create-user.js
node --check api/manage-user.js
node --check api/manage-file.js
node --check sw.js
python3 -m json.tool vercel.json >/dev/null
python3 -m json.tool manifest.webmanifest >/dev/null
node scripts/security-smoke.mjs
SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/rbac-smoke.mjs
```

## Recomendacao De Go/No-Go

### Pode seguir para piloto se:

- Segredos forem rotacionados.
- SMTP/redirect do Supabase forem configurados.
- Testes de permissao por perfil passarem.

### Nao escalar para SaaS ainda ate:

- Upload real estar validado na rede e nos aparelhos usados pela marcenaria.
- Logs/auditoria estarem implementados.
- Rate limit/WAF estarem definidos.
- Testes automatizados cobrirem perfis e APIs.
- Backup/PITR/plano de recuperacao estarem definidos.
