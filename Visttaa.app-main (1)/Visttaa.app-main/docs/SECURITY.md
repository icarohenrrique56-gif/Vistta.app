# Segurança

Controles existentes:

- `.env` ignorado e `.env.example` sem valores.
- Regras de leitura/escrita por usuário, empresa e papel.
- Firebase Authentication, Cloud Functions e Realtime Database Security Rules exigem autenticação e validam a empresa.
- Movimentos de caixa exigem administrador/gestor e usam registros append-only enquanto o caixa está aberto.
- Estoque usa transactions; a venda recebe um ID determinístico para impedir repetição do mesmo envio.
- `admin` e `manager` são os gestores da empresa; vendedores usam `role: seller` e não podem escrever perfis, permissões, caixa ou financeiro.
- A criação, edição e ativação/desativação de vendedores ocorre pelas Functions autorizadas; as Rules bloqueiam o bypass direto.
- O Realtime Database filtra vendas de vendedores por `criadoPor`; produtos são lidos de `produtosPublicos`, sem o campo `custo`.
- Vendas registram `vendedorId`, `vendedorNome` e `dataHoraServidor` sem remover o histórico quando o vendedor é inativado.

Riscos e ações externas:

- Restringir a API key Web por domínio no Google Cloud.
- Configurar Authorized domains no Firebase Auth.
- Rotacionar qualquer chave que tenha sido exposta fora do `.env`.
- Revisar regras com dados reais e Firebase Emulator antes do deploy.
- Atualizar dependências vulneráveis em janela controlada.
- O backend/Admin SDK recalcula preços e totais antes da gravação da venda.
