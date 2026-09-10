# API interna

As Cloud Functions Callable exportadas são:

- `finalizeSale`: valida usuário, empresa, itens e estoque; grava venda idempotente.
- `openCash`: abre um caixa por empresa.
- `closeCash`: fecha caixa respeitando operador/admin.
- `addCashEntry`: registra entrada, saída ou sangria; exige admin.

As chamadas são feitas pelo Firebase Callable SDK. Não há API HTTP pública documentada neste repositório.
