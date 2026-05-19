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

Para sair do MVP local, a recomendação é:

- Supabase para banco de dados.
- Supabase Auth para login.
- Supabase Storage para arquivos e fotos.
- Netlify para publicação do frontend.

Alternativa temporária:

- Google Sheets para coleta inicial.
- Google Drive para arquivos.
- MVP web como painel de validação.

Para piloto real com múltiplos usuários, não operar apenas em `localStorage`.

## Configuração Supabase

1. Criar um projeto no Supabase.
2. Abrir o SQL Editor.
3. Rodar os arquivos nesta ordem:
   - `supabase/001_schema.sql`
   - `supabase/002_rls.sql`
   - `supabase/003_storage.sql`
   - `supabase/004_seed_pilot.sql`
4. Criar usuários em Authentication.
5. Copiar os UUIDs dos usuários.
6. Inserir os perfis reais na tabela `profiles`.
7. Criar os projetos reais na tabela `projects`.
8. Criar os ambientes na tabela `rooms`.

## Configuração Netlify

1. Conectar o repositório `camillofranco/marcenaria-flow-erp`.
2. Build command: vazio.
3. Publish directory: `.`.
4. Criar variáveis de ambiente usando `.env.example`.
5. Fazer deploy.

Enquanto a integração Supabase no frontend não estiver completa, a versão publicada continua sendo o MVP visual com persistência local.

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

