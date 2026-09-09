# Autenticação

O Firebase Authentication oferece e-mail/senha, recuperação de senha e Google Redirect. O perfil complementar fica em `users/{uid}` com `role`, `empresaId`, e-mail e dados de convite.

A sessão é observada por `onAuthStateChanged`. O app limpa o estado local ao sair. A recuperação usa `sendPasswordResetEmail`; a redefinição valida `oobCode` com `verifyPasswordResetCode` e confirma a nova senha com `confirmPasswordReset`.

## Mensagens e duplicidade

O login usa uma mensagem genérica para credenciais inválidas. O cadastro informa quando o e-mail já possui conta e oferece entrar ou recuperar senha. A recuperação não revela se o e-mail existe. O Firebase Authentication impede duplicidade de contas pelo mesmo provedor/e-mail.

## Sessão e rotas

O projeto não usa React Router. Login, cadastro e recuperação são estados da tela `AuthScreen`; o link de redefinição do Firebase é processado quando a URL contém `mode=resetPassword` e `oobCode`. Áreas privadas só são renderizadas após `onAuthStateChanged` confirmar o usuário.

## Fluxo detalhado

Veja [AUTH-FLOW.md](AUTH-FLOW.md).

Configuração externa obrigatória: ativar os provedores no Firebase Authentication e cadastrar os domínios autorizados, inclusive o domínio de produção.
