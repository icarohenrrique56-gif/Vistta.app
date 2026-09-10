# Autenticação

O Firebase Authentication oferece e-mail/senha, recuperação de senha e Google Redirect. O perfil complementar fica em `users/{uid}` com `role`, `empresaId`, e-mail e dados de convite.

## Template do e-mail de recuperação

O HTML de referência está em [PASSWORD_RESET_EMAIL.html](PASSWORD_RESET_EMAIL.html). Para aplicá-lo, abra o Firebase Console em **Authentication > Templates > Password reset**, cole o conteúdo no editor disponível e publique a alteração. O Firebase substitui `%DISPLAY_NAME%` e `%LINK%` ao enviar a mensagem.

O template não é enviado pelo frontend nem pelo Vite: as mensagens continuam sendo disparadas por `sendPasswordResetEmail`. Se imagens forem adicionadas ao e-mail, use URLs HTTPS públicas e absolutas; caminhos relativos ao site e imagens `data:` não são confiáveis em clientes de e-mail.

A sessão é observada por `onAuthStateChanged`. O app limpa o estado local ao sair. A recuperação usa `sendPasswordResetEmail`; a redefinição valida `oobCode` com `verifyPasswordResetCode` e confirma a nova senha com `confirmPasswordReset`.

## Mensagens e duplicidade

O login usa uma mensagem genérica para credenciais inválidas. O cadastro informa quando o e-mail já possui conta e oferece entrar ou recuperar senha. A recuperação não revela se o e-mail existe. O Firebase Authentication impede duplicidade de contas pelo mesmo provedor/e-mail.

## Sessão e rotas

O projeto não usa React Router. Login, cadastro e recuperação são estados da tela `AuthScreen`; o link de redefinição do Firebase é processado quando a URL contém `mode=resetPassword` e `oobCode`. Áreas privadas só são renderizadas após `onAuthStateChanged` confirmar o usuário.

## Fluxo detalhado

Veja [AUTH-FLOW.md](AUTH-FLOW.md).

Configuração externa obrigatória: ativar os provedores no Firebase Authentication e cadastrar os domínios autorizados, inclusive o domínio de produção.
