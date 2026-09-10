# Testes

Validações executadas nesta auditoria:

- `npm run build`: OK.
- `npx firebase-tools deploy --only database --dry-run`: OK.
- Diagnósticos TypeScript dos arquivos alterados: sem erros.
- Referências aos arquivos removidos: nenhuma.

Não há suíte automatizada nem script de lint no repositório. As Functions e Rules devem ser validadas no Emulator antes do deploy. Ainda é necessário executar manualmente login, reset de senha, cadastro, permissões, CRUD, venda concorrente, caixa, mobile, domínio de produção e regras com contas de papéis diferentes.
