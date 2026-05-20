# Guia Rápido Para O Cliente Piloto

## Link De Acesso

https://marcenaria-flow-erp.vercel.app

## Objetivo Do Teste

Validar se o fluxo do Marcenaria Flow ERP representa a rotina real da marcenaria.

Nesta fase, o cliente deve testar:

- Abertura de projetos.
- Login individual por perfil: ADM, Medidor, Projetista, Comprador, Montador e Cliente.
- Checklists por ambiente.
- Solicitação e aprovação de compras.
- Alertas de obra.
- Pendências de montagem.
- Organização simulada de arquivos por cliente e ambiente.

## Como Usar Amanhã

1. Abrir o link no computador ou celular.
2. Entrar com e-mail e senha cadastrados pelo ADM.
3. Clicar em `Novo projeto` para cadastrar um projeto real.
4. Preencher número, cliente, endereço, data, responsáveis e ambientes.
5. Simular o fluxo real:
   - Medidor registra medição.
   - Projetista clica em `Start`.
   - Projetista marca ambientes e solicita compra.
   - ADM aprova compras e cria alertas.
   - Comprador marca itens como comprados.
   - Montador consulta rota, checklist e registra pendências.
6. Registrar dúvidas e travas encontradas pela equipe.

## Atenção Importante

Esta versão já usa login e banco Supabase. Os dados são compartilhados entre usuários conforme as permissões de cada perfil.

## O Que Observar Durante O Teste

Anotar:

- Campos que faltaram.
- Etapas que não fazem sentido.
- Termos que a equipe usaria com outro nome.
- Perfis que precisam de mais ou menos acesso.
- Dificuldades no celular.
- Alertas que precisam ser mais fortes.
- Informações que deveriam chegar automaticamente ao ADM.

## Próximo Passo Depois Do Teste

Depois da validação inicial, a próxima entrega é aprofundar a operação real com:

- Upload real de fotos e arquivos.
- Histórico de alterações.
- Notificações.
