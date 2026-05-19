# Marcenaria Flow ERP

Webapp de gestão operacional para marcenarias, criado para controlar projetos do início ao fim: abertura, medição, desenvolvimento técnico, compras, fabricação, montagem e assistência.

O projeto começou como MVP de apresentação e agora está preparado para iniciar um piloto real com uma primeira marcenaria.

## Como abrir

Abra `index.html` no navegador ou rode um servidor local na pasta do projeto:

```bash
python3 -m http.server 4173
```

Depois acesse `http://localhost:4173`.

## Estado atual

- MVP visual funcional.
- Repositório publicado no GitHub.
- Deploy público no Netlify: `https://marcenariaflow.netlify.app`.
- Documentação de piloto criada.
- Estrutura Supabase preparada para banco real.
- Configuração Netlify adicionada.
- Roadmap SaaS definido.

## O que está implementado

- Perfis: ADM, Medidor, Projetista, Comprador e Montador.
- Filtro de acesso por perfil, simulando `USEREMAIL()` do AppSheet.
- Cards de projetos com responsáveis, status, endereço, data de montagem e ambientes.
- Checklists de projeto e montagem por ambiente.
- Fotos de medição simuladas por ambiente.
- Lista de compras com aprovação ADM e status de compra.
- Alertas por criticidade: crítico, atenção e informativo.
- Organização simulada de Drive: `Projetos / Nº - Cliente / Etapa / Ambiente`.
- Persistência local no navegador via `localStorage`.
- Exportação/importação de backup JSON para transportar dados do piloto.

## Próximo passo operacional

Para operar com o primeiro cliente real, siga:

1. Leia `docs/OPERACAO_PILOTO_REAL.md`.
2. Preencha `data/projetos_piloto_template.csv` com 3 a 5 projetos reais.
3. Crie o projeto Supabase.
4. Rode os scripts em `supabase/`.
5. Cadastre usuários reais.
6. Publique no Netlify.
7. Acompanhe o uso por uma semana.

## Arquitetura recomendada para piloto real

- Frontend: webapp atual, evoluindo para integração real.
- Banco: Supabase Postgres.
- Login: Supabase Auth.
- Permissões: Supabase Row Level Security.
- Arquivos: Supabase Storage ou Google Drive integrado.
- Deploy: Netlify.

## Documentos principais

- `PILOTO_CLIENTE_MARCENARIA.md`: documento executivo para apresentar o piloto.
- `docs/OPERACAO_PILOTO_REAL.md`: plano de operação no cliente real.
- `docs/ROADMAP_SAAS.md`: evolução do piloto até SaaS comercial.
- `docs/BACKLOG_TECNICO.md`: fila técnica de implementação.
- `docs/SUPABASE_BOOTSTRAP.md`: criação do platform admin, primeiro ADM real e acessos.
- `supabase/001_schema.sql`: tabelas e tipos do banco.
- `supabase/002_rls.sql`: políticas de acesso por perfil.
- `supabase/003_storage.sql`: bucket de arquivos.
- `supabase/004_seed_pilot.sql`: seed inicial.

## Tabelas antigas para Google Sheets

### PROJETOS

Campos sugeridos: `ProjetoID`, `NumeroProjeto`, `Cliente`, `Endereco`, `DataMontagem`, `Status`, `MedidorEmail`, `ProjetistaEmail`, `CompradorEmail`, `MontadorEmail`, `ArquivoFabrica`, `ArquivoObra`, `CriadoEm`, `AtualizadoEm`.

### AMBIENTES

Campos sugeridos: `AmbienteID`, `ProjetoID`, `NomeAmbiente`, `FotosMedicao`, `ProjetoConcluido`, `MontagemConcluida`, `NotaAssistencia`, `StatusAssistencia`.

### LISTA_COMPRAS

Campos sugeridos: `CompraID`, `ProjetoID`, `Material`, `Quantidade`, `SolicitadoPor`, `AprovacaoADM`, `StatusCompra`, `Fatura`, `CriadoEm`.

### ALERTAS

Campos sugeridos: `AlertaID`, `ProjetoID`, `Nivel`, `Descricao`, `CriadoPor`, `CriadoEm`, `Resolvido`.

### USUARIOS

Campos sugeridos: `UsuarioID`, `Nome`, `Email`, `Perfil`, `Ativo`.

## Regras para AppSheet

- Security filters por e-mail e perfil usando `USEREMAIL()`.
- Ações de alteração de status para `Start`, `Liberar projeto`, `Aprovar compra`, `Marcar comprado`, `Entregue` e `Abrir assistência`.
- Bots de notificação para ADM em `Start`, compra pendente, alerta crítico e assistência aberta.
- File/Image columns com caminho de pasta calculado por projeto e ambiente.
