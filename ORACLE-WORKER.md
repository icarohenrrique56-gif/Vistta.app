# Oracle Worker do Vistta (sem Blaze)

## Visão geral

Este documento define a arquitetura de automação do Vistta usando uma VM Oracle Cloud Always Free como `worker` auxiliar. A camada principal do sistema continua sendo o Firebase Spark. A Oracle não substitui o frontend nem as regras do banco; ela atua como serviço confiável de processamento, fila e automação.

A arquitetura real identificada no repositório é:

- Frontend em React + TypeScript + Vite
- Firebase Authentication
- Realtime Database como banco principal
- Hosting do Firebase
- Cloud Functions existentes somente no código, mas não publicadas em ambiente de produção
- sem Firestore configurado
- sem Storage configurado
- sem Billing/Blaze ativado

Fluxo proposto:

```text
VISTTA
  ↓
Firebase (Auth + Realtime Database + Hosting)
  ↓
Oracle Worker (VM Always Free)
  ↓
Processamento e automação
  ↓
WhatsApp / integrações / fila / retry / histórico
```

## Arquitetura real do Vistta

### Banco efetivamente usado

O repositório usa `Realtime Database` e não `Firestore`.

Evidências no projeto:

- `src/config/firebase.ts` usa `getDatabase(app)`
- `database.rules.json` define regras para `users`, `empresas`, `caixas`, `vendas`, etc.
- `docs/DATABASE.md` afirma que não há Firestore nem Storage configurados
- busca por `firestore` no código não encontrou uso real

### Banco de dados e estrutura relevante

- `users/{uid}`
- `empresas/{empresaId}/info`
- `empresas/{empresaId}/produtos`
- `empresas/{empresaId}/clientes`
- `empresas/{empresaId}/vendas`
- `empresas/{empresaId}/caixas`
- `empresas/{empresaId}/caixaStatus`
- `empresas/{empresaId}/orcamentos`
- `empresas/{empresaId}/ordensServico`
- `empresas/{empresaId}/fornecedores`
- `empresas/{empresaId}/contas`
- `empresas/{empresaId}/categorias`
- `empresas/{empresaId}/usuarios`
- `platformAudit`

### Regras de segurança atuais

As regras do banco em `database.rules.json` isolam acesso por `empresaId` e por role (`admin`, `manager`, `seller`, `user`, `developer`). A Oracle não substitui essas regras; ela apenas processa eventos já autorizados e confiáveis.

## Banco e listeners

### Realtime Database

Para o processamento da Oracle, o listener correto é o `Admin SDK` do Node.js para Realtime Database.

Exemplos válidos de uso:

- `onValue(ref, callback)` para observar um nó específico
- `onChildAdded(ref, callback)` para eventos de criação
- `onChildChanged(ref, callback)` para atualizações
- `onDisconnect` e `runTransaction` quando houver necessidade de exclusividade

Regra obrigatória:

- não monitorar o banco inteiro
- monitorar somente caminhos necessários
- evitar leituras redundantes
- usar filtros no caminho e reduzir volume de dados

### Firestore

Não existe Firestore neste repositório. Portanto, a Oracle não deve usar listeners de Firestore neste projeto. Qualquer uso do Firestore seria uma arquitetura diferente, fora do estado real do Vistta atual.

## Objetivo da Oracle Worker

A Oracle Worker deve operar como serviço de automação resiliente para tarefas que não podem ser feitas em Cloud Functions no plano Spark, sem entrar em Billing.

Suas funções principais:

1. monitorar mudanças relevantes;
2. criar fila de eventos;
3. evitar duplicidade;
4. processar automaticamente;
5. registrar sucesso/erro;
6. permitir retry;
7. manter histórico;
8. não alterar dados críticos sem regra explícita.

## Arquitetura funcional

```text
Firebase RTDB (eventos relevantes)
        ↓
Oracle Worker (listener + fila)
        ↓
Validação + deduplicação + operationId/eventId
        ↓
Processador / worker
        ↓
WhatsApp / e-mail / webhook / notificação
        ↓
Histórico + retry + logs
```

## Fluxo recomendado

### 1. Monitoramento

O worker observa apenas os caminhos relevantes, por exemplo:

- `empresas/{empresaId}/ordensServico/{osId}`
- `empresas/{empresaId}/orcamentos/{orcamentoId}`
- `empresas/{empresaId}/vendas/{vendaId}`
- eventos customizados em `empresas/{empresaId}/automations/events`

### 2. Fila de eventos

Cada evento é convertido em um registro com estrutura mínima:

```json
{
  "eventId": "uuid",
  "operationId": "empresaId:tipo:resourceId:timestamp",
  "empresaId": "abc123",
  "type": "os_pronta",
  "resourceId": "os_987",
  "status": "PENDENTE",
  "payload": {},
  "source": { "uid": "user123", "role": "admin" },
  "createdAt": "2026-09-10T00:00:00.000Z",
  "attempts": 0,
  "lastError": null
}
```

### 3. Idempotência

- cada evento deve possuir `eventId` estável
- o processador deve verificar se `eventId` já foi registrado como `ENVIADO`
- se já foi processado, ignorar sem reenvio
- a mesma condição deve ser validada em nível de `operationId`

### 4. Retry

- `PENDENTE` → `PROCESSANDO` → `ENVIADO`
- falhas → `ERRO`
- retry controlado com backoff simples
- eventos persistidos localmente para recuperação após reinício

## Regras de validação antes do envio

Antes de enviar qualquer WhatsApp, o worker deve validar:

- empresa existe e está ativa
- usuário/origem existe e é permitido quando aplicável
- telefone válido e no formato esperado
- evento conhecido e suportado
- evento ainda não processado
- evento não está duplicado
- mensagem a ser enviada tem payload consistente

## Status do evento

```text
PENDENTE
PROCESSANDO
ENVIADO
ERRO
IGNORADO
```

### Regras

- `PENDENTE`: evento novo
- `PROCESSANDO`: foi selecionado por um worker
- `ENVIADO`: mensagem entregue ao provedor ou companhia de envio
- `ERRO`: falha técnica ou regra de negócio
- `IGNORADO`: evento inválido, sem telefone ou fora do escopo

## Fila resiliente

### Persistência local

A Oracle deve persistir a fila em disco e reabrir o processamento após reinicialização.

### Critérios de resiliência

- reinicialização da VM: reprocessar eventos pendentes
- internet instável: manter fila local e tentar novamente
- WhatsApp indisponível: controle de retry e backoff
- evento já processado: não enviar novamente
- processamento duplicado em concorrência: usar lock por `eventId` ou `operationId`

### Estratégia do lock

- um worker exclusivo pode assumir cada evento pendente
- usando arquivo lock local ou banco local leve (SQLite ou JSON em disco, se necessário)
- nunca processar o mesmo evento em paralelo

## Segurança da Oracle

A Oracle é serviço confiável separado; ela não substitui as Regras do Firebase.

### Regras mínimas de segurança

- firewall habilitado e portas estritas
- SSH seguro com chave pública
- usuário não-root para o serviço
- atualização do sistema
- logs centralizados
- rotação de credenciais
- `.env` fora do Git
- backups seguros da configuração
- sem exposição de endpoints públicos administrativos sem autenticação
- mínima privilege de leitura e escrita

### Service Account

NUNCA:

- armazenar JSON de credencial no Git
- colocar credencial em caminho público
- colocar informando no frontend
- usar credencial de admin do Firebase em um ambiente sem necessidade

Caminho recomendado:

- uso de variável de ambiente em servidor
- secret manager do host ou arquivo protegido fora do projeto
- serviço com escopo e permissões reduzidas

### Menor privilégio possível

A Oracle deve ler apenas os caminhos necessários e escrever apenas os registros de eventos/histórico aprovados. Não utilizar privilégios administrativos irrestritos quando uma leitura limitada for suficiente.

## Primeiro módulo de automação: WhatsApp

### Objetivo

Enviar notificações para eventos reais do Vistta, como:

- OS pronta
- pedido pronto
- orçamento
- pós-venda
- outros eventos realmente existentes

### Fluxo do módulo WhatsApp

1. O worker escuta o caminho de eventos
2. valida `empresaId`, `tipo`, telefone e payload
3. gera `eventId` e `operationId`
4. registra `status=PENDENTE`
5. processa e envia para o provedor WhatsApp
6. registra `status=ENVIADO` ou `ERRO`
7. persiste histórico

### Estrutura de evento

```json
{
  "eventId": "uuid",
  "operationId": "empresaId:os_pronta:os_123:timestamp",
  "empresaId": "empresa-1",
  "type": "os_pronta",
  "resourceId": "os_123",
  "clienteId": "cli_456",
  "telefone": "+5511999999999",
  "status": "PENDENTE",
  "payload": {
    "titulo": "Ótica Vistta",
    "mensagem": "Sua ordem de serviço está pronta para retirada."
  },
  "createdAt": "2026-09-10T00:00:00.000Z",
  "attempts": 0
}
```

## Fila e persistência

O worker deve manter:

- `queue/` para eventos pendentes
- `history/` para eventos processados
- `logs/` para erro, retri e diagnóstico
- `locks/` para bloqueio de processamento concorrente

### Regras de persistência

- nunca remover o evento imediatamente após o envio sem histórico
- manter tombstone ou registro de processamento
- evitar duplicidade observando `eventId`
- EventId deve ser determinístico se o evento vier do banco e for reprocessado

## Custos e limites da Oracle

A Oracle deve ser usada em limites do Always Free, respeitando o que a plataforma disponibiliza.

- usar somente requisitos necessários
- manter serviço pequeno e eficiente
- evitar leitura contínua do banco inteiro
- uso do Node.js em processo leve
- limitar logs e armazenamento

### Não permitido

- ativar recursos pagos sem autorização
- migrar Firebase para Blaze
- habilitar Billing no Firebase
- depender de Cloud Functions para manter arquitetura Spark

## Limitações conhecidas

- o Vistta atual usa Realtime Database e não Firestore
- a Oracle não substitui as regras do Firebase
- a Oracle depende de um serviço confiável para processar eventos sem expor endpoints inseguros
- qualquer automação de envio de WhatsApp precisa de validação real de telefone e empresa antes do envio
- o worker não deve alterar registros críticos sem regra explícita e auditoria

## Testes mínimos recomendados

1. evento válido e pendente → status vira `PROCESSANDO` e depois `ENVIADO`
2. mesmo `eventId` processado duas vezes → ignorado
3. empresa inválida → `IGNORADO`
4. telefone inválido → `IGNORADO`
5. provedor WhatsApp fora do ar → `ERRO` + retry
6. reinício da VM → fila reaproveita pendentes
7. registros duplicados em paralelo → apenas um worker processa
8. log e histórico registram falha com `operationId`

## Resumo de decisão arquitetural

A Oracle Worker é compatível com o Vistta atual porque:

- o sistema usa Realtime Database
- o projeto permanece no Spark
- não há Firestore em uso
- a automação fica separada do frontend
- a fila é resiliente e idempotente
- o WhatsApp é o primeiro módulo de automação seguro

## Observação de compliance

A Oracle Worker deve ser implementada apenas como automação confiável em infraestrutura separada, sem abrir uma “porta dos fundos” do Vistta. Ela não deve substituir autenticação, validação de Dados do usuário, regras de acesso do Firebase e nem expor APIs administrativas sem autenticação.
