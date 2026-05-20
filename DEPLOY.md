# Como Publicar No Vercel

O projeto está preparado para Vercel porque o limite do Netlify foi atingido.

## Configuração

1. Conecte o repositório `camillofranco/marcenaria-flow-erp` no Vercel.
2. Framework preset: `Other`.
3. Build command: deixe vazio.
4. Output directory: deixe vazio ou `.`.
5. Configure as variáveis de ambiente de produção:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Deploy Via CLI

```bash
npx vercel --prod --yes
```

## O Que O Vercel Usa

- Arquivos estáticos na raiz: `index.html`, `styles.css`, `app.js`.
- API serverless: `api/create-user.js`.
- Rotas e headers: `vercel.json`.

Depois de publicar, atualize qualquer documentação operacional com a nova URL final do Vercel.
