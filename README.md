# Marcenaria Flow ERP

Protótipo web navegável para validar o fluxo do aplicativo antes de montar a versão final no Google AppSheet com Google Sheets e Google Drive.

## Como abrir

Abra `index.html` no navegador ou rode um servidor local na pasta do projeto:

```bash
python3 -m http.server 4173
```

Depois acesse `http://localhost:4173`.

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

## Tabelas para Google Sheets

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
