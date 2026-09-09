# Arquitetura

O frontend é uma aplicação React 18 com TypeScript, Vite e Tailwind CSS. `src/main.tsx` monta o `App` dentro de `ErrorBoundary`; `AppContext` concentra autenticação, estado operacional e listeners do Realtime Database.

## Camadas

- `src/screens`: telas de autenticação, dashboard, PDV, caixa, estoque, clientes, financeiro, orçamentos, OS, cadastros e ajuda.
- `src/components`: componentes compartilhados, formulários e sidebar.
- `src/config/firebase.ts`: inicialização do Firebase Web SDK usando variáveis `VITE_FIREBASE_*`.
- `functions/src/index.ts`: operações server-side de venda, caixa e lançamentos.
- `database.rules.json`: autorização e validação do Realtime Database.

Não há roteador de URLs; a navegação autenticada usa `activeTab` no contexto.

## Categoria do produto

O sistema é um ERP operacional/comercial vertical para óticas. Seu núcleo atual é varejo, caixa, estoque, clientes, receitas, orçamento e ordem de serviço. Compras avançadas, fiscal, RH, produção, logística completa e CRM avançado são extensões futuras, não módulos implícitos.

## Evolução

A evolução recomendada é priorizar auditoria, testes, backup, permissões granulares, movimentação de estoque, compras e financeiro antes de adicionar integrações externas ou módulos industriais. O mapa completo está em [ERP-MODULES.md](ERP-MODULES.md).
