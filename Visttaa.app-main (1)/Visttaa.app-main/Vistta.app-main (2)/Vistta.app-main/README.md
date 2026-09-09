# VISTTA.app

Sistema de gestão para óticas construído com React, TypeScript, Vite e Firebase Realtime Database.

## Desenvolvimento

```bash
npm install
npm run dev
```

Validação de produção:

```bash
npm run build
npm run preview
```

Backend transacional:

```bash
npm run build:all
npx firebase-tools deploy --only functions,database
```

As funções `finalizeSale`, `openCash`, `closeCash` e `addCashEntry` exigem usuário autenticado e validam a empresa pelo perfil em `users/{uid}`. O deploy requer Node 20 no ambiente do Firebase; o container local pode emitir apenas um aviso se estiver usando outra versão.

## Variáveis de ambiente

Crie um arquivo `.env` local com as variáveis `VITE_FIREBASE_*` usadas em `src/config/firebase.ts`. O arquivo `.env` não deve ser versionado. As chaves web do Firebase devem ter restrições de domínio configuradas no Google Cloud Console.

## Firebase

As regras do Realtime Database estão em `database.rules.json` e são referenciadas por `firebase.json`:

```bash
firebase deploy --only database
```

O fluxo de cadastro cria a conta autenticada, configura a empresa na primeira entrada e carrega os dados por `empresaId`. A criação de usuários convidados usa o cliente secundário apenas como compatibilidade com a arquitetura atual; para produção, convites, alteração de perfil e revogação de contas devem ser migrados para Cloud Functions/Admin SDK.

## Permissões

- Administradores gerenciam cadastros administrativos, fornecedores, contas e usuários.
- Usuários operacionais podem operar PDV, caixa, clientes, produtos e ordens conforme as regras do banco.
- As regras do banco são a fronteira de segurança; a visibilidade da sidebar não é considerada autorização.

## Documentação

A documentação técnica, operacional, de segurança e o relatório de auditoria estão em [`docs/README.md`](docs/README.md).

## Estado atual e limitações conhecidas

- Não há suíte automatizada no repositório; o build TypeScript/Vite é a validação automatizada disponível.
- Firebase Auth e Realtime Database precisam estar configurados antes do uso.
- Venda, estoque e caixa ainda devem ser movidos para uma operação server-side idempotente antes de um cenário de alta concorrência.
- A auditoria de dependências deve ser executada periodicamente com `npm audit`; vulnerabilidades transitivas atuais podem exigir atualização coordenada do Firebase.