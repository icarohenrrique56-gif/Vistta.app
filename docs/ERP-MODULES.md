# Mapeamento ERP

## Classificação do produto

O VISTTA é hoje um **ERP operacional/comercial vertical para óticas**, com caixa, vendas, estoque, clientes, receitas, orçamentos, ordens de serviço e financeiro gerencial básico. Não é um ERP industrial, fiscal ou de RH completo.

## Matriz de módulos

| Módulo | Existe | Parcial | Não existe | Prioridade | Observação |
|---|---:|---:|---:|---:|---|
| Dashboard operacional | Sim |  |  | P0 | KPIs, vendas, estoque crítico, orçamentos e OS. |
| Menu e navegação | Sim |  |  | P0 | Sidebar desktop e menu inferior/mobile. |
| Empresas/multiempresa | Sim | Sim |  | P0 | Isolamento por `empresaId`; não há filial/departamento. |
| Usuários e perfis | Sim | Sim |  | P0 | Admin/vendedor; permissões ainda pouco granulares. |
| Auditoria de ações |  |  | Sim | P1 | Logs técnicos existem, trilha de negócio não. |
| Configurações/parâmetros |  | Sim |  | P2 | Configuração inicial da ótica; sem central de parâmetros. |
| Clientes | Sim | Sim |  | P0 | CRUD, contatos e receita ótica; sem inativação/histórico completo. |
| Fornecedores | Sim | Sim |  | P1 | Cadastro; sem compras integradas. |
| Produtos/estoque | Sim | Sim |  | P0 | CRUD, saldo, mínimo e busca; sem depósitos, lotes ou movimentação formal. |
| Categorias | Sim |  |  | P0 | Cadastro genérico. |
| Serviços |  | Sim |  | P1 | OS representa serviços óticos; sem catálogo de serviços. |
| Caixa | Sim | Sim |  | P0 | Abertura, lançamentos e fechamento server-side. |
| PDV/vendas | Sim | Sim |  | P0 | Carrinho, pagamento, desconto e venda idempotente. |
| Orçamentos | Sim |  |  | P0 | Criados pelo PDV e convertidos em OS. |
| Ordens de serviço | Sim | Sim |  | P0 | Status, itens, previsão e observações; sem anexos/histórico. |
| Financeiro | Sim | Sim |  | P1 | Contas, fluxo básico e DRE gerencial; sem bancos/conciliação/parcelas. |
| Compras |  |  | Sim | P1 | Fornecedor existe, fluxo de compras não. |
| Faturamento/fiscal |  |  | Sim | P2 | Depende de escopo fiscal, país e integração especializada. |
| Contratos |  |  | Sim | P2 | Não é necessário para a operação atual da ótica. |
| Documentos/anexos |  |  | Sim | P2 | Não há Storage configurado. |
| CRM |  | Sim |  | P2 | Clientes e histórico operacional existem; oportunidades/follow-up não. |
| Manutenção |  | Sim |  | P2 | OS pode representar reparo, sem ativos/planos. |
| Produção |  |  | Sim | P3 | Fora do escopo de uma ótica varejista. |
| Logística/transportadoras |  |  | Sim | P3 | Não há entrega ou rastreamento. |
| RH |  |  | Sim | P3 | Fora do escopo atual. |
| Ativos/patrimônio |  |  | Sim | P3 | Fora do escopo atual. |
| Aprovações/workflow |  | Sim |  | P2 | Orçamento/OS têm estados, mas sem alçada configurável. |
| Notificações |  | Sim |  | P1 | Alertas visuais; sem central, e-mail ou vencimentos automáticos. |
| Relatórios/exportação |  | Sim |  | P1 | Dashboard e tabelas; sem PDF/CSV formal. |
| Busca global |  |  | Sim | P2 | Buscas são locais por módulo. |
| Backup/restauração |  |  | Sim | P0 | Depende de operação Firebase externa. |

## Cadastros e controles

Os cadastros atuais têm criar/editar/excluir em diferentes níveis. Inativação, filtros avançados, ordenação, paginação, histórico e trilha de auditoria ainda não são padrões comuns. Exclusões usam confirmação nativa em alguns módulos; não há lixeira ou restauração.

## Estoque atual

Existe saldo por produto, estoque mínimo, busca, reserva transacional durante venda e alerta de estoque crítico. Não existem estoque por filial/depósito, disponível versus reservado versus bloqueado, transferências, inventário, lotes, validade, série ou rastreabilidade formal.

## Financeiro atual

Existe caixa operacional, contas a pagar/receber e indicadores DRE baseados em vendas e custo. Não existem conciliação bancária, contas bancárias, parcelas, recorrências, juros/multas, inadimplência, orçamento versus realizado ou integração de pagamentos.

## O que não implementar agora

Produção, RH, folha, fiscal, logística completa, patrimônio, marketplace e integrações bancárias não devem ser adicionados sem decisão de produto, requisitos legais e desenho de dados. Eles não são necessários para validar o núcleo de uma ótica.

## Roadmap evolutivo

### Fase 1 — Essencial

- Testes automatizados de regras, autenticação, venda e caixa.
- Auditoria de ações administrativas e financeiras.
- Backup/restauração documentados.
- Permissões por ação e não apenas por papel.
- Estados vazios, erros e feedback uniformes.

### Fase 2 — Profissionalização

- Movimentação de estoque e inventário.
- Compras: solicitação, cotação, pedido e recebimento.
- Financeiro com parcelas, vencimentos, conciliação e previsto versus realizado.
- Exportação CSV/PDF e relatórios por período.
- Central de notificações e filtros/ordenação.

### Fase 3 — Escala

- Filiais, depósitos e centros de custo.
- Busca global e paginação server-side.
- Storage para documentos com regras próprias.
- Observabilidade, métricas e alertas operacionais.
- Separação de domínios e consultas mais eficientes.

### Fase 4 — Ecossistema

- Integração fiscal após validação especializada.
- Integrações bancárias, pagamentos, WhatsApp e logística.
- CRM avançado e contratos, se o modelo comercial exigir.

========================================
NOVOS MÓDULOS RECOMENDADOS
========================================

Esta análise considera o produto atual, que já possui PDV, caixa, clientes com receitas
e lembretes, estoque, fornecedores, orçamentos, ordens de serviço e financeiro básico.
Não foram recomendados módulos que apenas repitam essas áreas.

## Módulo 1 — Implementar agora: Alertas operacionais

- **Problema resolvido:** informações importantes estão espalhadas em dashboard, clientes,
  estoque, contas e ordens de serviço; o usuário pode perder estoque crítico, prazo de OS,
  conta vencida ou retorno de cliente.
- **Benefício:** transforma dados existentes em uma fila acionável, reduzindo atrasos e
  aumentando retorno comercial sem criar um novo cadastro complexo.
- **Impacto:** ALTO.
- **Complexidade:** BAIXA.
- **Prioridade:** 1.
- **Dependências:** `produtos`, `contas`, `ordensServico`, `clientes`, metas futuras.
- **Impacto no Firebase/banco:** leitura dos nós já existentes; opcionalmente um nó pequeno
  de preferências por empresa. Não exige Functions, Storage, Cloud Run ou Blaze.
- **Impacto na UX:** centro de alertas no dashboard e filtros por tipo/prioridade; não criar
  uma nova tela lateral inicialmente.
- **Custo:** baixo; cálculo no cliente e consultas já carregadas, com atenção para não criar
  listeners extras.
- **Status:** recomendado para implementação imediata; ainda não implementado.

## Módulo 2 — Implementar depois: CRM de retorno e histórico do cliente

- **Problema resolvido:** o cliente já possui compras, receitas e datas de lembrete, mas não
  há uma visão consolidada de última compra, produtos, retorno e contato realizado.
- **Benefício:** melhora pós-venda, reativação de clientes inativos e retenção.
- **Impacto:** ALTO.
- **Complexidade:** MÉDIA.
- **Prioridade:** 2.
- **Dependências:** dados de `clientes`, `vendas`, `ordensServico`, consentimento de contato
  e uma trilha simples de interações.
- **Impacto no Firebase/banco:** novo nó por empresa para interações e segmentos; regras
  específicas de leitura/escrita. Sem envio automático de WhatsApp e sem Functions.
- **Impacto na UX:** ampliar a ficha de cliente e adicionar filtros; não criar CRM separado.
- **Custo:** baixo a médio; evitar automações externas e listeners globais.
- **Status:** recomendado depois dos alertas; parcialmente coberto hoje por clientes,
  receitas, histórico de compras e links manuais para WhatsApp.

## Módulo 3 — Planejar: Compras, reposição e movimentação de estoque

- **Problema resolvido:** fornecedores já existem, mas não há pedido de compra, recebimento,
  custo histórico ou inventário formal.
- **Benefício:** reduz ruptura, melhora margem e cria rastreabilidade do estoque.
- **Impacto:** ALTO.
- **Complexidade:** ALTA.
- **Prioridade:** 3.
- **Dependências:** modelo de movimentação, permissões, fornecedores, produtos e auditoria.
- **Impacto no Firebase/banco:** novos nós de pedidos e movimentos; transações e regras
  cuidadosas no Realtime Database. Não mover controle de estoque para lógica desprotegida
  no frontend.
- **Impacto na UX:** novo fluxo operacional, mas deve começar integrado à tela Estoque.
- **Custo:** médio; gratuito no Spark se permanecer em Realtime Database e sem Functions,
  respeitando volume e leituras.
- **Status:** planejar antes de codificar; não criar apenas um menu de Compras vazio.

## Módulo 4 — Planejar: Comissões e metas

- **Problema resolvido:** o sistema registra o vendedor da venda, mas não possui cálculo,
  metas, períodos ou ranking.
- **Benefício:** gestão comercial e acompanhamento de desempenho.
- **Impacto:** MÉDIO.
- **Complexidade:** MÉDIA.
- **Prioridade:** 4.
- **Dependências:** política comercial da ótica, vendedor persistido na venda, cancelamentos,
  períodos e permissões por ação.
- **Impacto no Firebase/banco:** campos de configuração e agregações; calcular sob demanda
  a partir de vendas, evitando jobs ou Functions Gen2.
- **Impacto na UX:** indicadores dentro do Dashboard/Financeiro, sem menu independente no
  primeiro ciclo.
- **Custo:** baixo a médio; compatível com Spark se não houver processamento agendado.
- **Status:** planejar após CRM e auditoria; não implementado.

## Avaliação de itens específicos

| Oportunidade | Situação atual | Decisão |
|---|---|---|
| Histórico, última compra e produtos | Parcial em Clientes e vendas | Consolidar no CRM, sem módulo duplicado |
| Agenda, retorno e exame | OS tem previsão/status | Não criar agenda antes de validar demanda real |
| Pós-venda e garantia | Lembretes e WhatsApp manual | Incorporar ao CRM; garantia só com requisito confirmado |
| Laboratório/produção | OS já possui status “Em Laboratório” | Evoluir OS com prazo/histórico, não criar produção |
| Lentes e tratamentos | Produto/OS têm material e tratamento simples | Ampliar catálogo de produtos quando houver dados reais |
| Fidelidade | Não existe | Baixa prioridade; requer estratégia comercial e custo de manutenção |
| Inteligência gerencial | Dashboard e DRE básico existem | Melhorar indicadores existentes antes de novo módulo |
| Exportação e relatórios | Parcial | Prioridade operacional depois de alertas, sem serviço pago |

## Não prioritário agora

Fidelidade, produção industrial, logística, integração bancária, emissão fiscal, Cloud
Functions adicionais, notificações automáticas por e-mail/WhatsApp, Storage e qualquer
recurso que exija Blaze. A estratégia permanece **sem Blaze, sem billing e com preferência
por cálculos locais e dados já carregados**.
