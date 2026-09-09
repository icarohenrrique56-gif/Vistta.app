# VISTTA.app

Sistema de gestão para óticas construído com React, TypeScript, Vite e Firebase Realtime Database.

## Desenvolvimento

```bash
npm install
npm run dev
```

Validação de produção:

```bash
npm run build
npm run preview
```

Backend transacional:

```bash
npm run build:all
npx firebase-tools deploy --only functions,database
```

As funções `finalizeSale`, `openCash`, `closeCash` e `addCashEntry` exigem usuário autenticado e validam a empresa pelo perfil em `users/{uid}`. O deploy requer Node 20 no ambiente do Firebase; o container local pode emitir apenas um aviso se estiver usando outra versão.

## Variáveis de ambiente

Crie um arquivo `.env` local com as variáveis `VITE_FIREBASE_*` usadas em `src/config/firebase.ts`. O arquivo `.env` não deve ser versionado. As chaves web do Firebase devem ter restrições de domínio configuradas no Google Cloud Console.

## Firebase

As regras do Realtime Database estão em `database.rules.json` e são referenciadas por `firebase.json`:

```bash
firebase deploy --only database
```

O fluxo de cadastro cria a conta autenticada, configura a empresa na primeira entrada e carrega os dados por `empresaId`. A criação de usuários convidados usa o cliente secundário apenas como compatibilidade com a arquitetura atual; para produção, convites, alteração de perfil e revogação de contas devem ser migrados para Cloud Functions/Admin SDK.

## Permissões

- Administradores gerenciam cadastros administrativos, fornecedores, contas e usuários.
- Usuários operacionais podem operar PDV, caixa, clientes, produtos e ordens conforme as regras do banco.
- As regras do banco são a fronteira de segurança; a visibilidade da sidebar não é considerada autorização.

## Configuração do Administrador Developer

`developer` é a conta de nível global da plataforma. Ela não pertence ao fluxo normal de uma empresa e não deve ser criada ou promovida pelo frontend. O mecanismo seguro deste projeto é um custom claim aplicado pelo Admin SDK no script `functions/scripts/set-owner-claim.mjs`.

### 1. Criar a primeira conta

Crie a conta normalmente em **Firebase Console > Authentication > Users > Add user**, usando e-mail/senha, ou faça o primeiro login com Google depois de ativar o provedor Google. Copie o UID exibido pelo Firebase Authentication.

### 2. Preparar o acesso administrativo

O script usa credenciais do Firebase Admin SDK por Application Default Credentials. Execute-o em uma máquina administrativa com acesso ao projeto correto, por exemplo após configurar `GOOGLE_APPLICATION_CREDENTIALS` apontando para um arquivo de credenciais local não versionado. Nunca coloque essa variável, a chave ou o arquivo no README, no frontend ou no repositório.

### 3. Promover o UID para `developer`

Na raiz do projeto, execute:

```bash
node functions/scripts/set-owner-claim.mjs <UID_DO_FIREBASE_AUTH>
```

O script preserva outros claims existentes e grava `role: developer` e `platformOwner: true`. A role não pode ser escolhida durante o cadastro nem alterada pela interface.

### 4. Validar a configuração

Confirme no Firebase Authentication que o UID e o e-mail estão corretos. Depois faça logout e login novamente para renovar o ID token. O app deve reconhecer a sessão como `developer` e abrir o painel global sem exigir `empresaId`. O comando também informa no terminal o UID promovido.

### 5. Acessar o painel

Com a sessão renovada, acesse `/developer` ou `/admin`. As duas rotas apontam para o painel global. O backend das Cloud Functions valida o custom claim; alterar URL, localStorage ou botões não concede acesso.

### 6. Criar outros administradores

Um administrador da empresa pode convidar membros pela tela **Usuários**, mas os convites só podem receber `manager` ou `user`. Para promover com segurança um perfil já existente a administrador, um operador autorizado deve usar o Admin SDK na raiz do projeto:

```bash
node functions/scripts/set-profile-role.mjs <UID_DO_USUARIO> admin
```

O perfil precisa existir em `users/{uid}` e estar vinculado a uma empresa. Para gestores ou usuários, use o mesmo comando com `manager` ou `user`. Faça logout/login após a alteração.

### 7. Remover ou alterar um developer

Para remover o acesso global, execute:

```bash
node functions/scripts/set-owner-claim.mjs <UID_DO_FIREBASE_AUTH> revoke
```

Depois valide com logout/login e mantenha pelo menos uma conta administrativa de recuperação sob controle do responsável pelo projeto. Para alterar a conta, revogue a antiga e promova o novo UID. Não altere claims diretamente no cliente e não crie um bypass para recuperar acesso.

### 8. Hierarquia de permissões

`developer` é global e administra a plataforma. `admin` administra somente a empresa vinculada. `manager` opera os recursos permitidos da empresa sem administrar perfis. `user` possui acesso operacional conforme as regras. A hierarquia é:

```text
developer → admin → manager → user
```

As regras do Realtime Database isolam os dados por `empresaId`; o frontend apenas reflete essas permissões. O developer é validado pelo custom claim no backend e não precisa de uma empresa vinculada.

## Documentação

A documentação técnica, operacional, de segurança e o relatório de auditoria estão em [`docs/README.md`](docs/README.md).

## Estado atual e limitações conhecidas


## Automação de correções

O CI e o fluxo controlado de propostas para Issues do GlitchTip estão documentados em [`docs/AUTOMATION.md`](docs/AUTOMATION.md). A automação trabalha em branch isolada, exige typecheck/build, cria apenas PR draft e não faz deploy automaticamente.