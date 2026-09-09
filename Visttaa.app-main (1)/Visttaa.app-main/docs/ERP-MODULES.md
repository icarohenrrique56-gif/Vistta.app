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
