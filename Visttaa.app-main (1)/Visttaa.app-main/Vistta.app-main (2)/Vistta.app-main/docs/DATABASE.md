# Banco de dados

Estrutura principal:

- `users/{uid}`: perfil e empresa vinculada.
- `empresas/{empresaId}/info`: nome e criador.
- `empresas/{empresaId}/produtos`
- `clientes`, `vendas`, `caixas`, `orcamentos`, `ordensServico`
- `fornecedores`, `contas`, `categorias`, `usuarios`

O isolamento por empresa é feito comparando `users/{uid}/empresaId` com o caminho acessado. Valores críticos de venda e caixa são processados pelas Functions.

Não há Firestore nem Storage configurados neste repositório.
