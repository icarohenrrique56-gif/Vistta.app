# GlitchTip

## Configuração

O VISTTA usa `@sentry/react` apontando para o GlitchTip em `app.glitchtip.com`. O DSN permanece no frontend porque DSNs web não são tokens de autenticação; nenhum Auth Token deve ser colocado no código ou no bundle.

A configuração fica em `src/main.tsx` e envia:

- `release`: derivado de `package.json`, no formato `vistta-erp@1.0.0`;
- `environment`: `production` no build padrão, `staging` com `vite build --mode staging` e `development` nos demais modos;
- `beforeSend`: sanitização de usuário, contexto, tags, breadcrumbs e request.

O arquivo `.sentryclirc` contém a autenticação do CLI apenas no ambiente local. Ele é ignorado pelo Git. Se um token tiver sido versionado ou exposto, revogue-o e gere outro fora do repositório.

## Captura

O SDK mantém as integrações padrão do navegador, incluindo erros globais (`window.onerror` e `unhandledrejection`) e breadcrumbs de navegação. O `Sentry.ErrorBoundary` captura falhas da árvore React, e o `ErrorBoundary` do VISTTA mantém a tela de recuperação existente e também reporta o erro.

`src/services/telemetry.ts` é a camada central para:

- `captureException`;
- `captureMessage`;
- `captureFirebaseError`;
- `setUserContext`;
- `setModuleContext`;
- `addBreadcrumb`.

Falhas relevantes de Authentication e Realtime Database são reportadas sem alterar o resultado da operação original. O contexto usa `module`, `action`, `operation` e a rota atual.

## Segurança e sanitização

O serviço remove campos com nomes como `password`, `senha`, `token`, `accessToken`, `refreshToken`, `apiKey`, `secret`, `authorization`, `cookie`, `cardNumber` e `cvv`. Objetos são limitados por profundidade, quantidade de chaves e tamanho de texto.

O usuário enviado ao GlitchTip contém somente um identificador técnico. E-mail, senha, claims, tokens, dados de cartão e objetos completos não são enviados como contexto. A URL enviada no request é reduzida ao pathname.

## Release e sourcemaps

O release é construído em `vite.config.ts` a partir do nome e da versão do `package.json`. O upload usa a mesma fonte por meio de `$npm_package_name@$npm_package_version`:

```bash
npm run build
npm run upload:sourcemaps
npx firebase-tools deploy --only hosting
```

O `build.sourcemap` permanece `true`, gerando `dist/*.map`. O upload deve ocorrer antes do deploy para que o GlitchTip resolva o stack trace para arquivo, linha e coluna originais.

Para validar localmente sem deploy:

```bash
npm run typecheck
npm run build
find dist -type f -name '*.map'
```

No painel do GlitchTip, abra um evento do release correto e confirme `environment`, release, arquivo original, linha/coluna e ausência de código minificado no stack trace.

## Testes controlados

Os hooks de teste só são registrados quando o environment não é `production`. Não existe botão público no produto. Em desenvolvimento ou staging, abra o console do navegador:

```js
window.__VISTTA_GLITCHTIP_TEST__.throwJavaScript()
window.__VISTTA_GLITCHTIP_TEST__.rejectPromise()
window.__VISTTA_GLITCHTIP_TEST__.throwReact()
await window.__VISTTA_GLITCHTIP_TEST__.firebaseRead()
```

Os testes geram, respectivamente, erro JavaScript, rejeição não tratada, erro dentro do React ErrorBoundary e uma leitura somente-leitura de um caminho reservado que deve ser negada pelas regras existentes. As regras Firebase não são alteradas para o teste.

Valide no GlitchTip:

1. evento recebido;
2. release `vistta-erp@1.0.0`;
3. environment esperado;
4. módulo, ação e operação;
5. breadcrumbs e rota;
6. arquivo, linha, coluna e sourcemap;
7. ausência de credenciais ou PII desnecessária.

Depois da validação, não execute os hooks em produção.

## Diagnóstico

Use `module`, `action`, `operation`, `release` e `environment` para agrupar problemas. Exemplos de módulos reais incluem `autenticacao`, `pdv`, `caixa`, `estoque`, `clientes`, `orcamentos`, `ordens`, `financeiro` e `administracao`.

Ao investigar um erro Firebase, o evento deve preservar o erro original e indicar a operação (`database_read`, `database_write`, `database_delete`, `database_listener` ou autenticação), sem incluir caminhos que contenham identificadores desnecessários.
