# Fluxo de autenticação

A aplicação atual não usa React Router. A autenticação é exibida em uma única tela e alterna entre estados equivalentes às rotas lógicas abaixo:

```text
LOGIN
  |-- Ainda não tenho conta? --> CADASTRO
  |-- Esqueci minha senha? --> RECUPERAR SENHA
  |-- Google --> Firebase Redirect

CADASTRO
  |-- Já tenho uma conta? --> LOGIN
  |-- e-mail já existente --> Entrar / Recuperar senha

RECUPERAR SENHA
  |-- e-mail --> Firebase sendPasswordResetEmail
  |-- sucesso --> mensagem segura e Tentar novamente / Voltar para entrar

LINK DO FIREBASE
  |-- mode=resetPassword&oobCode=... --> DEFINIR NOVA SENHA
  |-- código inválido/expirado --> solicitar novo link
  |-- sucesso --> LOGIN
```

## Estados

- Login: e-mail, senha, mostrar/ocultar senha, Google e recuperação.
- Cadastro: e-mail, senha, confirmação, termos e Google.
- Recuperação: somente e-mail, sem revelar se a conta existe.
- Redefinição: código Firebase validado, senha nova e confirmação.

## Segurança

Senhas nunca são armazenadas no Realtime Database, localStorage, sessionStorage ou logs. O Firebase Authentication é a fonte de identidade. Mensagens de recuperação são genéricas para reduzir enumeração de contas.

## Limitação atual

Não existem URLs independentes `/login`, `/cadastro`, `/recuperar-senha` e `/redefinir-senha`; a aplicação é uma SPA sem roteador. O fluxo visual é equivalente, e o link de redefinição usa os parâmetros oficiais do Firebase. Uma futura adoção de React Router deve preservar os mesmos estados e proteções.
