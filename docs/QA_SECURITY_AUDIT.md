# QA E Auditoria De Seguranca

Data: 2026-05-20

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
- Supabase Storage planejado.
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

- Risco para piloto controlado: medio.
- Risco para operacao comercial/SaaS: alto ate concluir itens pendentes.
- Prioridade antes de escalar clientes: aplicar migracao `supabase/006_security_hardening.sql`, rotacionar segredos ja compartilhados fora de canal seguro, configurar Auth/SMTP/MFA e implementar upload real com RLS revisado.

## Correcoes Aplicadas Nesta Auditoria

### Headers HTTP

Adicionado em `vercel.json`:

- `Content-Security-Policy`.
- `Permissions-Policy`.
- `Cache-Control: no-store` para `/api/*`.
- Mantidos `X-Frame-Options`, `X-Content-Type-Options` e `Referrer-Policy`.

Objetivo:

- Reduzir risco de XSS.
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

### APIs Administrativas

Arquivos:

- `api/create-user.js`
- `api/manage-user.js`

Melhorias:

- `Cache-Control: no-store`.
- Parsing mais estrito de `Authorization: Bearer`.
- Normalizacao de e-mail.
- Validacao basica de e-mail.
- Validacao de UUID para alteracao/exclusao de usuarios.
- Limite de tamanho para campos textuais.
- Perfil solicitante precisa estar ativo.

### XSS/HTML Injection

Arquivo: `app.js`

Melhorias:

- Adicionados helpers `escapeHtml` e `escapeAttr`.
- Campos vindos de usuarios/projetos/ambientes/compras/alertas/arquivos passaram a ser escapados nos principais pontos renderizados via `innerHTML`.

### Superficie Legada

Removidos arquivos legados de Netlify:

- `netlify/functions/create-user.js`
- `netlify.toml`
- `_headers`
- `_redirects`

Motivo:

- A producao esta na Vercel.
- Manter funcao administrativa duplicada aumenta superficie de erro e confusao operacional.

### RLS E Storage

Criada migracao:

- `supabase/006_security_hardening.sql`

Ela endurece:

- Visualizacao de compras por membros do projeto.
- Atualizacao de compras por ADM ou comprador vinculado.
- Insercao de arquivos por membros do projeto.
- Storage privado por `company_id` e `project_id`, nao apenas por empresa.

### Smoke Test De Seguranca

Criado script:

- `scripts/security-smoke.mjs`

Ele valida:

- Headers de seguranca em producao.
- APIs administrativas bloqueando GET.
- `Cache-Control: no-store` nas APIs.
- Manifest PWA disponivel.
- Service worker sem cache de `/api/*`.

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

#### Migracao de RLS ainda precisa ser aplicada no Supabase

O arquivo `supabase/006_security_hardening.sql` esta criado, mas precisa ser executado no projeto Supabase real.

Risco se nao aplicar:

- Comprador pode ter visibilidade maior do que o necessario dentro da empresa.
- Storage pode ficar amplo demais para todos os usuarios da mesma empresa quando upload real for implementado.

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

#### Upload real ainda nao esta concluido

Sem upload real, o piloto valida fluxo. Quando arquivos reais forem armazenados, o controle de acesso precisa ser testado com rigor.

Acao:

- Implementar upload em storage privado.
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

- [ ] Login legivel no celular.
- [ ] Sidebar/nav utilizavel no celular.
- [ ] Cards nao estouram largura.
- [ ] Modais funcionam no celular.
- [ ] Tour nao sobrepoe controles importantes.
- [ ] App pode ser adicionado a tela inicial.

## Checklist Cyberseguranca Antes Do Cliente

- [ ] Rotacionar segredos compartilhados fora de canal seguro.
- [ ] Aplicar `supabase/006_security_hardening.sql`.
- [ ] Revisar Supabase Security Advisor.
- [ ] Revisar Supabase Performance Advisor.
- [ ] Confirmar RLS em todas as tabelas.
- [ ] Confirmar bucket `project-files` privado.
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
node --check sw.js
python3 -m json.tool vercel.json >/dev/null
python3 -m json.tool manifest.webmanifest >/dev/null
node scripts/security-smoke.mjs
```

## Recomendacao De Go/No-Go

### Pode seguir para piloto se:

- Segredos forem rotacionados.
- Migracao `006_security_hardening.sql` for aplicada.
- SMTP/redirect do Supabase forem configurados.
- Testes de permissao por perfil passarem.

### Nao escalar para SaaS ainda ate:

- Upload real estar protegido por Storage RLS.
- Logs/auditoria estarem implementados.
- Rate limit/WAF estarem definidos.
- Testes automatizados cobrirem perfis e APIs.
- Backup/PITR/plano de recuperacao estarem definidos.
