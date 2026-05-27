# QA E Auditoria De Seguranca

Data: 2026-05-27

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

O sistema esta apto para piloto controlado, mas ainda nao deve ser tratado como SaaS final.

Classificacao atual apos as correcoes deste ciclo:

- Risco para piloto controlado: baixo/medio.
- Risco para operacao comercial/SaaS: alto ate concluir itens pendentes.
- Prioridade antes de escalar clientes: rotacionar segredos ja compartilhados fora de canal seguro, configurar Auth/SMTP/MFA, ativar monitoramento e ampliar testes automatizados por perfil.

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

#### Sem testes automatizados

Hoje a validacao e manual/estatica.

Acao:

- Criar testes de permissao por perfil.
- Criar testes API para usuario nao ADM.
- Criar testes de UI mobile.

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

- [ ] Login ADM tecnico.
- [ ] Login ADM cliente.
- [ ] Login medidor.
- [ ] Login projetista.
- [ ] Login comprador.
- [ ] Login montador.
- [ ] Login cliente.
- [ ] Logout limpa a sessao visual.
- [ ] Alterar senha funciona para usuario logado.
- [ ] Recuperacao de senha envia e-mail depois de configurar SMTP/redirect.

### Usuarios

- [ ] ADM cria usuario.
- [ ] ADM altera usuario.
- [ ] ADM desativa/exclui usuario sem vinculo.
- [ ] ADM nao exclui proprio usuario.
- [ ] Usuario comum nao ve tela Pessoas.
- [ ] Usuario comum nao chama API administrativa com sucesso.

### Projetos

- [ ] ADM cria projeto real.
- [ ] Projeto exige campos obrigatorios.
- [ ] Cancelar modal nao exige preenchimento.
- [ ] Responsaveis aparecem nos selects.
- [ ] Busca filtra projeto/cliente/endereco.
- [ ] Status visual correto.

### Permissoes

- [ ] ADM ve todos os projetos da empresa.
- [ ] Medidor ve apenas projetos vinculados.
- [ ] Projetista ve apenas projetos vinculados.
- [ ] Comprador ve apenas projetos vinculados/compras relevantes.
- [ ] Montador ve apenas projetos vinculados.
- [ ] Cliente ve apenas o proprio projeto.
- [ ] Usuario sem vinculo nao ve projetos.

### Fluxo

- [ ] Medidor simula fotos e libera projeto.
- [ ] Projetista da start, marca checklist e solicita compra.
- [ ] ADM aprova compra.
- [ ] Comprador marca comprado/anexa fatura simulada.
- [ ] Montador abre rota e registra pendencia.
- [ ] ADM ve alerta critico.
- [ ] Cliente acompanha status sem informacoes internas.

### Mobile/Webapp

- [x] Login legivel no celular.
- [ ] Sidebar/nav utilizavel no celular apos login real.
- [ ] Cards nao estouram largura apos login real.
- [ ] Modais funcionam no celular.
- [ ] Tour nao sobrepoe controles importantes.
- [ ] App pode ser adicionado a tela inicial.

## Checklist Cyberseguranca Antes Do Cliente

- [ ] Rotacionar segredos compartilhados fora de canal seguro.
- [x] Aplicar `supabase/006_security_hardening.sql`.
- [ ] Revisar Supabase Security Advisor.
- [ ] Revisar Supabase Performance Advisor.
- [ ] Confirmar RLS em todas as tabelas.
- [x] Confirmar bucket `project-files` privado.
- [ ] Configurar Auth Site URL e Redirect URLs.
- [ ] Configurar SMTP proprio.
- [ ] Configurar MFA na conta Supabase e GitHub.
- [ ] Configurar acesso da Vercel com 2FA.
- [ ] Revisar variaveis de ambiente na Vercel.
- [ ] Fazer teste de usuario comum tentando acessar dados de outro perfil.
- [ ] Fazer teste de API administrativa sem token e com usuario nao ADM.

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
```

## Recomendacao De Go/No-Go

### Pode seguir para piloto se:

- Segredos forem rotacionados.
- SMTP/redirect do Supabase forem configurados.
- Testes de permissao por perfil passarem.

### Nao escalar para SaaS ainda ate:

- Upload real estar validado em obra com cada perfil.
- Logs/auditoria estarem implementados.
- Rate limit/WAF estarem definidos.
- Testes automatizados cobrirem perfis e APIs.
- Backup/PITR/plano de recuperacao estarem definidos.
