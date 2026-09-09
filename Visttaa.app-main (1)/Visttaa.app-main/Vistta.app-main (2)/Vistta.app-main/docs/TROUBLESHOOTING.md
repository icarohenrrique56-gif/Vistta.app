# Troubleshooting

- `auth/api-key-not-valid`: confira `.env`, chave do projeto, restrições de domínio e reinicie o Vite.
- `auth/unauthorized-domain`: adicione o domínio em Authentication > Settings > Authorized domains.
- Erro de permissão no banco: publique `database.rules.json` no projeto correto e confirme `empresaId`/papel.
- Function indisponível: confirme deploy, região padrão e build com Node 20.
- Tela protegida por erro: use “Recarregar aplicação” e verifique o console sem compartilhar dados sensíveis.
- Venda recusada: abra o caixa, confirme estoque e valide se o produto ainda existe.
