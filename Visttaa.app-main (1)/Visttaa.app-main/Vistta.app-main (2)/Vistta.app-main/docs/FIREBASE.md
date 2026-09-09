# Firebase

Serviços usados:

- Authentication: login, cadastro, Google e reset de senha.
- Realtime Database: perfis, empresas e dados operacionais.
- Cloud Functions: vendas idempotentes, estoque e caixa.

Deploy de regras e Functions:

```bash
npm run build:all
npx firebase deploy --only functions,database
```

O projeto está apontado pelo `.firebaserc` para `vistta-2e1df`. O deploy das Functions requer Node 20.
