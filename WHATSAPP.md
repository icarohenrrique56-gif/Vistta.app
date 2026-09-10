# Módulo WhatsApp do Vistta

## Escopo

O módulo WhatsApp é o primeiro fluxo automatizado da Oracle Worker. Ele processa eventos do Vistta e envia notificações por WhatsApp somente quando o evento é válido, autorizado e ainda não foi enviado.

## Eventos elegíveis

Eventos permitidos devem existir no domínio real do sistema, por exemplo:

- `os_pronta`
- `pedido_pronto`
- `orcamento`
- `pos_venda`
- outros eventos realmente existentes no ERP

Não devem ser criados eventos invisíveis ou inventados sem um caminho real de negócio.

## Regras de validação

Antes do envio, o sistema deve verificar:

1. `empresaId` existe
2. empresa está ativa
3. usuário/origem existe quando for necessário
4. telefone está em formato válido
5. evento é suportado
6. evento ainda não foi processado
7. payload está preenchido e consistente
8. idempotência em `eventId` / `operationId`

## Payload mínimo

```json
{
  "type": "os_pronta",
  "empresaId": "empresa-1",
  "resourceId": "os_123",
  "telefone": "+5511999999999",
  "mensagem": "Sua ordem de serviço está pronta para retirada."
}
```

## Status do evento

- `PENDENTE`
- `PROCESSANDO`
- `ENVIADO`
- `ERRO`
- `IGNORADO`

## Idempotência

A regra central é: o mesmo evento nunca pode gerar duas mensagens.

Para isso:

- gerar `eventId` obrigatório
- gerar `operationId` persistente
- verificar se o `eventId` já foi processado
- se existir registro `ENVIADO`, ignorar
- se existir `ERRO`, aplicar retry controlado

## Fila de processamento

A Oracle Worker deve manter a fila em disco e resgatar eventos após reinício.

### Estrutura de fila

```text
queue/
  pending/
  processing/
  retry/
  failed/

history/
logs/
locks/
```

## Exemplo de ciclo

```text
Evento detectado em RTDB
  → validação
  → new eventId
  → status = PENDENTE
  → worker pega evento
  → status = PROCESSANDO
  → chama provedor WhatsApp
  → status = ENVIADO ou ERRO
  → grava histórico + logs
```

## Requisitos de segurança

- o WhatsApp não pode receber eventos sem empresa e telefone validados
- não expor endpoint público sem autenticação
- não salvar credenciais em arquivos de código
- limitar acesso ao provedor de mensagens
- usar logs sem dados sensíveis extras

## Limites do fluxo atual

- o WhatsApp é um módulo de automação adicional e não substitui nenhum fluxo de negócio principal do ERP
- ele precisa de um caminho real de evento no banco
- não deve depender de Firestore neste momento
- a Oracle Worker não deve operar sem validação de empresa e autorização mínima

## Observações finais

Antes de ativar o módulo WhatsApp, o projeto deve ter:

- caminho real de evento de negócio
- empresa/telefone validados
- fila persistente e retry
- logs de observabilidade
- status de evento e idempotência
- documentação interna do evento e do provedor
