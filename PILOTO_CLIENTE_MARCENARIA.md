# Piloto Cliente Real: Marcenaria Flow ERP

## 1. O Que É O Programa

O **Marcenaria Flow ERP** é um sistema de gestão operacional criado para marcenarias que precisam controlar projetos do início ao fim: abertura do cliente, medição, desenvolvimento técnico, compras, fabricação, montagem e pós-venda.

Nesta primeira fase, o sistema será implantado como **piloto operacional** em uma marcenaria real. O objetivo é validar o fluxo de trabalho com usuários reais antes de evoluir para uma versão definitiva com banco de dados, login, permissões avançadas e integrações completas.

O sistema centraliza em uma única tela as informações que normalmente ficam espalhadas em WhatsApp, planilhas, fotos no celular, pastas de Drive e conversas entre setores.

## 2. Para Que Serve

O programa serve para organizar a comunicação entre os setores da marcenaria e reduzir falhas durante a execução dos projetos.

Ele ajuda a responder perguntas como:

- Qual projeto está em medição?
- Quem é o projetista responsável?
- Quais ambientes já foram finalizados no projeto técnico?
- Quais materiais especiais precisam ser comprados?
- O ADM já aprovou a compra?
- O comprador já comprou ou recebeu o material?
- O montador tem acesso aos arquivos corretos da obra?
- Existe algum alerta crítico antes da instalação?
- Alguma peça faltou ou precisa de assistência?
- Onde estão as fotos, PDFs e arquivos de cada cliente?

Na prática, o Marcenaria Flow ERP funciona como um painel de controle da produção, conectando ADM, Medidor, Projetista, Comprador e Montador.

## 3. Problema Que O Sistema Resolve

Em muitas marcenarias, o fluxo de trabalho depende de mensagens soltas, fotos enviadas em grupos, arquivos compartilhados sem padrão e aprovações feitas verbalmente.

Isso gera riscos como:

- Fotos de medição perdidas.
- Projetista sem informação atualizada da obra.
- Comprador recebendo pedido tarde demais.
- Montador usando arquivo antigo.
- ADM sem visão clara do andamento.
- Pendências de montagem demorando para chegar à fábrica.
- Falta de rastreabilidade sobre quem fez cada etapa.

O sistema foi criado para reduzir esses problemas por meio de um fluxo visual, simples e separado por responsabilidade.

## 4. Perfis De Usuário

O piloto trabalha com cinco perfis principais.

### Administrador

É o usuário com visão completa do sistema.

Responsabilidades:

- Criar projetos.
- Cadastrar cliente, endereço e data de montagem.
- Definir responsáveis por setor.
- Acompanhar status geral.
- Aprovar ou recusar compras.
- Criar alertas críticos.
- Acompanhar pendências e assistências.

### Medidor

É o responsável por coletar as informações técnicas no local da obra.

Responsabilidades:

- Visualizar apenas os projetos atribuídos a ele.
- Conferir endereço e dados do cliente.
- Registrar ambientes.
- Tirar ou anexar fotos por ambiente.
- Finalizar medição e liberar para o projetista.

### Projetista

É o responsável pelo desenvolvimento técnico do projeto.

Responsabilidades:

- Iniciar o desenvolvimento do projeto.
- Consultar fotos da medição.
- Marcar ambientes concluídos.
- Solicitar materiais especiais.
- Anexar arquivos técnicos de fábrica e obra.
- Sinalizar informações importantes para montagem.

### Comprador

É o responsável por transformar pedidos aprovados em compras reais.

Responsabilidades:

- Ver materiais aprovados pelo ADM.
- Atualizar status da compra.
- Marcar item como comprado.
- Marcar item como entregue.
- Anexar comprovantes ou faturas.

### Montador

É o responsável pela instalação no cliente.

Responsabilidades:

- Consultar rota/endereço.
- Ver arquivos liberados para obra.
- Consultar alertas críticos antes da montagem.
- Fazer checklist por ambiente.
- Relatar pendências, peças faltantes ou assistência.

## 5. Como Se Utiliza No Piloto

Nesta fase, o sistema será usado como um protótipo funcional para simular o fluxo real da marcenaria.

O piloto deve ser usado em projetos reais, mas com acompanhamento próximo. A equipe deve registrar onde o fluxo funcionou bem, onde faltaram campos, quais telas precisam melhorar e quais automações serão obrigatórias na versão final.

### Passo 1: ADM Cria O Projeto

O administrador abre um novo card de projeto e informa:

- Número do projeto.
- Nome do cliente.
- Endereço.
- Data prevista de montagem.
- Medidor responsável.
- Projetista responsável.
- Montador responsável.
- Ambientes contratados.

Exemplo de ambientes:

- Cozinha.
- Lavanderia.
- Quarto casal.
- Home office.
- Banheiro.
- Área gourmet.

### Passo 2: Medidor Executa A Medição

O medidor acessa o projeto atribuído a ele, confere o endereço e registra as informações de cada ambiente.

No fluxo ideal, cada ambiente terá suas próprias fotos e observações.

Exemplo:

- Projeto: `MF-2401 - Ana Martins`.
- Pasta: `Projetos / MF-2401 - Ana Martins / Medicao / Cozinha`.
- Fotos: parede hidráulica, medidas gerais, pontos elétricos, nível do piso, detalhes de interferência.

Ao terminar, o medidor libera o projeto para desenvolvimento.

### Passo 3: Projetista Inicia O Desenvolvimento

O projetista recebe o projeto liberado e clica em `Start`.

Esse início registra que o projeto entrou em desenvolvimento. O ADM passa a saber que o trabalho foi iniciado.

Durante o desenvolvimento, o projetista:

- Consulta fotos da medição.
- Marca ambientes concluídos.
- Solicita materiais especiais.
- Registra alertas para montagem.
- Anexa arquivos técnicos.

Arquivos esperados:

- Arquivo de fábrica.
- PDF ou arquivo de visualização para obra.
- Plano de montagem, se necessário.

### Passo 4: ADM Analisa Compras

Quando o projetista solicita materiais, o ADM analisa os itens.

O ADM pode:

- Aprovar compra.
- Recusar compra.
- Pedir revisão.

Somente os itens aprovados devem seguir para o comprador.

### Passo 5: Comprador Atualiza Suprimentos

O comprador vê os itens aprovados e atualiza o andamento:

- Aguardando cotação.
- Comprado.
- Entregue na fábrica.

Quando possível, o comprador também anexa fatura, nota fiscal ou comprovante.

### Passo 6: Montador Executa A Obra

O montador acessa o projeto no dia da montagem.

Ele deve consultar:

- Endereço.
- Rota.
- Arquivos da pasta Obra.
- Alertas visuais.
- Checklist de ambientes.

Alertas esperados:

- Crítico: risco de gás, elétrica, hidráulica, parede frágil ou medida sensível.
- Atenção: mudança recente, tomada deslocada, detalhe de acabamento.
- Informativo: preferência estética, puxador, sentido de abertura, observação do cliente.

Ao finalizar cada ambiente, o montador marca o checklist.

Se houver pendência, ele registra uma nota. O ADM deve receber essa informação rapidamente para organizar reposição, assistência ou retrabalho.

## 6. O Que Será Validado No Cliente Real

O piloto deve validar se o fluxo desenhado realmente combina com a operação da marcenaria.

Pontos que devem ser observados:

- Se os perfis estão corretos.
- Se faltam usuários ou cargos.
- Se os nomes dos status fazem sentido.
- Se o ADM precisa de mais campos.
- Se o medidor precisa de campos técnicos extras.
- Se o projetista precisa separar arquivos por tipo.
- Se o comprador precisa controlar fornecedor, valor e prazo.
- Se o montador consegue usar a tela em celular na obra.
- Se os alertas estão claros.
- Se o checklist por ambiente é suficiente.
- Se o fluxo de assistência está completo.

## 7. Limitações Da Versão Piloto Atual

A versão atual é um MVP para apresentação e validação de fluxo.

Ela ainda não é a versão definitiva de produção.

Limitações conhecidas:

- Os dados são salvos localmente no navegador.
- Ainda não há login real por e-mail.
- Ainda não há banco de dados compartilhado.
- Ainda não há upload real para Google Drive ou Supabase Storage.
- Ainda não há notificações automáticas.
- Ainda não há histórico/auditoria de alterações.
- Ainda não há permissões reais por usuário.
- Ainda não há integração com WhatsApp, e-mail ou agenda.
- Ainda não há relatórios financeiros ou produtivos.

Essas limitações são esperadas para o piloto inicial. O objetivo agora é validar o processo antes de investir na estrutura final.

## 8. Próximo Passo: Operação Com Cliente Real

O próximo passo é usar o piloto com uma marcenaria real durante um ciclo controlado.

Recomendação de implantação:

1. Selecionar 3 a 5 projetos reais da marcenaria.
2. Cadastrar esses projetos no sistema.
3. Definir os usuários que representarão cada perfil.
4. Acompanhar o uso por pelo menos 1 semana.
5. Registrar dúvidas, falhas, campos ausentes e melhorias.
6. Reunir feedback do ADM, projetista, comprador, medidor e montador.
7. Fechar a lista de requisitos da versão de produção.

Durante o piloto, o sistema deve ser observado como ferramenta de processo, não apenas como tela bonita. A pergunta principal é:

> Este fluxo ajuda a marcenaria a trabalhar melhor, com menos ruído, menos esquecimento e mais controle?

## 9. Evolução Recomendada Para Versão Real

Após validação do piloto, a recomendação técnica é evoluir para uma arquitetura com banco de dados real.

Estrutura recomendada:

- Frontend web responsivo.
- Supabase como banco de dados principal.
- Supabase Auth para login.
- Row Level Security para permissões por perfil.
- Supabase Storage ou Google Drive para arquivos.
- Netlify ou Vercel para publicação.
- Automação de alertas por e-mail ou WhatsApp.

O Google Sheets pode continuar existindo como apoio para relatórios, exportação ou conferência administrativa. Porém, para o sistema operacional da marcenaria, o ideal é usar banco de dados real.

## 10. Critérios De Sucesso Do Piloto

O piloto será considerado bem-sucedido se:

- A equipe entender o fluxo sem treinamento complexo.
- O ADM conseguir visualizar o andamento dos projetos.
- O medidor conseguir organizar informações por ambiente.
- O projetista conseguir registrar progresso e compras.
- O comprador conseguir enxergar prioridades.
- O montador conseguir consultar arquivos e alertas em campo.
- As pendências de montagem chegarem mais rápido ao ADM.
- A marcenaria perceber redução de retrabalho e falhas de comunicação.

## 11. Decisão Esperada Ao Final Do Piloto

Ao final do teste, a marcenaria deverá decidir:

- Quais campos são obrigatórios.
- Quais automações são indispensáveis.
- Quais permissões cada perfil deve ter.
- Se os arquivos ficarão no Google Drive ou no Supabase Storage.
- Se a versão definitiva será webapp próprio ou AppSheet.
- Quais relatórios precisam existir.

Com essas decisões, o projeto deixa de ser apenas MVP e passa para a fase de construção da versão operacional.

