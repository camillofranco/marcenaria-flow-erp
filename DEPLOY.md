# Como publicar para o cliente acessar

Este protótipo é um webapp estático: basta hospedar os arquivos `index.html`, `styles.css` e `app.js`.

## Opção mais rápida: Netlify Drop

Site publicado para o piloto:

`https://endearing-cajeta-68549c.netlify.app`

1. Acesse `https://app.netlify.com/drop`.
2. Arraste a pasta do projeto ou o arquivo `.zip`.
3. O Netlify gera um link público na hora.
4. Envie esse link para o cliente.

Observação: o app salva alterações no navegador de cada pessoa via `localStorage`. Isso é ótimo para demonstração, mas ainda não é banco de dados compartilhado.

## Opção com controle: Vercel

1. Crie um projeto no Vercel.
2. Envie esta pasta ou conecte um repositório GitHub.
3. Framework: `Other`.
4. Build command: deixe vazio.
5. Output directory: deixe como raiz do projeto.

## Opção Google/AppSheet

Use este protótipo para validar telas e fluxo. Para uso real da marcenaria, o ideal é migrar a lógica para:

- Google Sheets como banco.
- Google Drive para arquivos e fotos.
- AppSheet para login, permissões por `USEREMAIL()`, automações e notificações.

## Arquivos necessários

- `index.html`
- `styles.css`
- `app.js`
- `README.md` opcional
