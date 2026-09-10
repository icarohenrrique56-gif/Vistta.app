# Auditoria das Cloud Functions

## Diagnóstico de produção

Projeto verificado: `vistta-2e1df`  
Região esperada: `us-central1`  
Frontend: `https://vistta-2e1df.web.app`

Em 10/09/2026, `firebase functions:list --project vistta-2e1df` retornou:

```text
No functions found in project vistta-2e1df.
```

O preflight para `closeCash` também retornou HTTP 404:

```text
OPTIONS https://us-central1-vistta-2e1df.cloudfunctions.net/closeCash
```

Assim, o erro exibido pelo navegador como CORS é consequência de uma URL de Function
inexistente. Não é um erro de login ou de cabeçalho CORS do código atual.

## Auditoria específica do fechamento do caixa

O caminho utilizado pelo frontend é `empresas/{empresaId}/caixas/{caixaId}` no
Realtime Database. Não há Firestore Collection/Document nem Firestore Rules nesse fluxo.

Antes da correção, a escrita de fechamento era negada por `PERMISSION_DENIED`: embora a
regra específica de `caixas/$caixaId` permitisse `aberto -> fechado`, a validação genérica
de `empresas/$empresaId/$collection` também incluía `caixas`. Essa validação avaliava
`newData.child('operador')` no nível da coleção `caixas`, em vez do documento
`caixas/{caixaId}`, e retornava falso para um caixa existente.

O código agora não mascara mais o erro original. A tela registra:

```text
error.code
error.message
error.details
```

quando o Firebase retornar uma nova rejeição.

## Integridade e concorrência

`closeCash` usa `runTransaction` no documento do caixa. A transação:

- aborta se o caixa já estiver fechado;
- aborta se o operador não tiver permissão;
- confirma somente uma transição `aberto -> fechado`;
- preserva operador e valor inicial;
- grava o fechamento antes de sincronizar o indicador `caixaStatus`.

Duas abas ou dois usuários concorrentes não conseguem confirmar o mesmo fechamento:
somente a transação que observar o estado `aberto` pode ser comprometida. O indicador é
derivado e não é a fonte de verdade do fechamento.

## `closeCash`

- **Arquivo:** `functions/src/index.ts`
- **Tipo:** Cloud Functions v2 `onCall`
- **Região:** padrão `us-central1` (não há região customizada)
- **Runtime:** Node.js 20
- **Chamada:** `httpsCallable(firebaseFunctions, 'closeCash')`
- **Payload:** `{ requestId, caixaId }`
- **Autenticação:** `request.auth.uid`, perfil ativo, empresa ativa, role `admin` ou `manager`
- **Autorização:** admin pode fechar; manager precisa ser o operador do caixa
- **Banco:** Realtime Database, não Firestore
- **Idempotência:** `requestId` em `operacoes/caixa`
- **Concorrência:** transação no nó do caixa impede fechamento duplo

Como é `onCall`, o SDK Firebase trata o protocolo e o preflight. Não foi adicionado CORS
manual e não deve ser usado `Access-Control-Allow-Origin: *`.

## Functions chamadas pelo frontend

| Function | Tipo | Chamada | Auth/controle |
|---|---|---|---|
| `openCash` | v2 `onCall` | `AppContext.abrirCaixa` | gestor + empresa ativa |
| `closeCash` | v2 `onCall` | `AppContext.fecharCaixa` | gestor + operador/admin |
| `addCashEntry` | v2 `onCall` | `AppContext.registrarLancamentoCaixa` | gestor + operador/admin |
| `finalizeSale` | v2 `onCall` | `AppContext.finalizarVenda` | usuário + empresa ativa |
| `listSellerProducts` | v2 `onCall` | pós-venda do vendedor | vendedor |
| `createSeller` | v2 `onCall` | gestão de usuários | admin/manager |
| `updateSeller` | v2 `onCall` | gestão de usuários | admin/manager |
| `setSellerStatus` | v2 `onCall` | gestão de usuários | admin/manager |
| `getPlatformOverview` | v2 `onCall` | administração da plataforma | claim developer/platformOwner |
| `listPlatformCompanies` | v2 `onCall` | administração da plataforma | claim developer/platformOwner |
| `setCompanyStatus` | v2 `onCall` | administração da plataforma | claim developer/platformOwner |
| `setUserStatus` | v2 `onCall` | administração da plataforma | claim developer/platformOwner |

Todas as Functions chamadas pelo frontend usam `onCall`, portanto compartilham o mesmo
tratamento automático de CORS e autenticação do SDK. Não há URL manual divergente no
frontend.

## Webhook separado

`glitchtipIssueWebhook` é a única Function `onRequest`. Ela usa `cors: false` de propósito,
aceita somente `POST` assinado por `x-vistta-webhook-signature` e não é chamada pelo
frontend. Não deve receber CORS aberto.

## Resultado da auditoria

- Código local das Functions: compilação OK.
- Região do frontend e padrão v2: compatíveis com `us-central1`.
- Payload de `closeCash`: compatível.
- Autenticação e autorização no código: presentes.
- Regras e gravação do caixa: Realtime Database com validação server-side.
- Produção: Functions ausentes; todas as chamadas de Functions falharão até publicação.

## Substituições Spark implementadas

O fluxo de caixa não depende mais das Functions ausentes:

- `openCash`: atualização atômica de `caixas/{id}` e `caixaStatus`.
- `closeCash`: transação protegida com transição única `aberto → fechado`.
- `addCashEntry`: gravação em `lancamentos` somente enquanto o caixa está aberto e pelo
  operador autorizado.
- Totais de fechamento são derivados no frontend de vendas e lançamentos; não são aceitos
  como valores de confiança enviados pelo navegador.
- As regras preservam empresa, usuário, role, operador, fundo inicial e histórico, e
  impedem reabertura ou alteração de caixa fechado.
- `caixaStatus` é tratado apenas como indicador derivado, com tipo, empresa e role
  protegidos; a autorização real permanece no registro `caixas/{id}`.

## Classificação das demais Functions

| Função | Finalidade | Substituição sem Blaze | Risco | Status |
|---|---|---|---|---|
| `closeCash` | Fechar caixa | Transação RTDB + Rules | baixo, com totais derivados | substituída |
| `openCash` | Abrir caixa | Update atômico RTDB + Rules | baixo/moderado: concorrência de abertura deve ser monitorada | substituída |
| `addCashEntry` | Lançamento de caixa | Push RTDB + Rules | baixo | substituída |
| `finalizeSale` | Venda, preço e baixa de estoque | Não há equivalente seguro completo em Rules | alto: cliente pode forjar preço/estoque | permanece Function |
| `listSellerProducts` | Produtos públicos do vendedor | Leitura RTDB de `produtosPublicos` | baixo | pode ser substituída depois |
| `createSeller` | Criar Auth e perfil | Auth client não cria usuário administrativo sem sessão separada | alto | permanece Function |
| `updateSeller` | Alterar Auth e perfil | Não há equivalente seguro | alto | permanece Function |
| `setSellerStatus` | Bloquear Auth e perfil | Rules podem bloquear dados, mas não desabilitam Auth | alto | permanece Function |
| `getPlatformOverview` | Administração global | Não deve ser exposta ao cliente | crítico | permanece Function |
| `listPlatformCompanies` | Administração global | Não deve ser exposta ao cliente | crítico | permanece Function |
| `setCompanyStatus` | Bloquear empresa | Rules podem bloquear leituras, mas operação administrativa exige backend | alto | permanece Function |
| `setUserStatus` | Bloquear usuário | Rules podem bloquear dados, mas operação global exige backend | alto | permanece Function |
| `glitchtipIssueWebhook` | Webhook HMAC | Serviço externo; não é caminho do ERP | alto se exposto | permanece `onRequest` |

## Publicação e custo

O `firebase.json` padrão publica somente Hosting e Realtime Database para manter o projeto
no Spark. Functions v2 exigem Cloud Build e Artifact Registry neste projeto, e o Firebase bloqueia a
publicação sem Blaze. Não foi ativado billing. As operações críticas de caixa foram
desacopladas sem abrir regras indiscriminadamente. Vendas, gestão de identidade e
administração global não foram movidas para o frontend porque isso seria uma migração
insegura, não uma solução.

Para corrigir o erro em produção, é necessário autorizar explicitamente a migração para
Blaze e publicar as Functions. Sem essa autorização, a alternativa segura é manter as
operações que dependem de Functions indisponíveis, em vez de mover fechamento de caixa,
estoque ou vendas para o frontend.
