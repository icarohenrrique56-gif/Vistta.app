# Automação de Issues do GlitchTip

## Estado

A automação foi preparada para detectar uma Issue do GlitchTip, analisá-la em ambiente isolado, aplicar no máximo três patches controlados, executar validações e abrir um PR draft. Ela não faz deploy, não altera `main` diretamente e não acessa o Firebase.

Fluxo:

```text
GlitchTip
  -> legado não implantado no projeto Spark
  -> GitHub repository_dispatch
  -> .github/workflows/glitchtip-repair.yml
  -> análise sanitizada
  -> branch ai/fix-glitchtip-*
  -> política de arquivos
  -> typecheck/build/sourcemaps
  -> PR draft
  -> aprovação humana
```

O workflow só é disparado por `repository_dispatch` ou manualmente. A configuração externa é obrigatória; sem secrets a análise falha de forma segura.

## CI obrigatório

[`.github/workflows/validate.yml`](../.github/workflows/validate.yml) executa em Pull Requests e em pushes para `main`:

```bash
npm ci
npm run typecheck
npm run build
npm run validate:sourcemaps
```

Se um script `test` existir, ele também é executado. Atualmente o projeto não possui esse script, portanto typecheck, build e sourcemaps são as validações disponíveis.

A branch `main` deve ter este check configurado como obrigatório no GitHub antes de aceitar PRs automatizados.

## Reparos controlados

O worker em `automation/src/analyze-issue.mjs`:

- consulta a Issue usando o token do GlitchTip somente no backend/Actions;
- remove campos sensíveis e limita tamanho/profundidade;
- lê somente arquivos relacionados do escopo permitido;
- exige resposta JSON com diagnóstico e unified diff;
- não executa comandos enviados pela IA;
- não permite arquivos protegidos;
- nunca lê `.env` ou `.sentryclirc`.

A política em `automation/policy.json` permite inicialmente somente `src/`, `tests/` e `docs/`, com no máximo oito arquivos. Regras Firebase, Functions, configuração Vite, dependências e arquivos de secrets ficam bloqueados.

O workflow aplica no máximo três tentativas. Cada tentativa executa typecheck, build, teste se configurado e verificação de sourcemaps. Depois de três falhas, o job falha e nenhum PR de correção é criado.

## Webhook

O código legado `glitchtipIssueWebhook` em `functions/src/index.ts` não faz parte do deploy Spark atual. O fluxo ativo do VISTTA não depende de Cloud Functions.

```text
x-vistta-webhook-signature: HMAC-SHA256(raw_body, GLITCHTIP_WEBHOOK_SECRET)
```

O payload mínimo esperado é:

```json
{
  "issue_id": "12345",
  "release": "vistta-erp@1.0.0",
  "environment": "production",
  "module": "clientes",
  "action": "criar_cliente",
  "operation": "database_write"
}
```

Somente `issue_id`, `release` e `environment` são encaminhados ao GitHub. O workflow consulta os detalhes da Issue diretamente no GlitchTip.

O comportamento de assinatura deve ser conferido na instalação GlitchTip usada pelo projeto. Se ela não suportar HMAC customizado, deve ser usado um gateway que valide o segredo antes de encaminhar a requisição; não remova a validação para aceitar payloads anônimos.

## Secrets

### GitHub Actions

Configurar no repositório ou em um Environment protegido:

```text
GLITCHTIP_BASE_URL
GLITCHTIP_API_TOKEN
AI_API_URL
AI_API_KEY
AI_MODEL
```

### Cloud Functions

Configurar no ambiente seguro das Functions:

```text
GLITCHTIP_WEBHOOK_SECRET
GITHUB_DISPATCH_TOKEN
GITHUB_REPOSITORY
```

`GITHUB_DISPATCH_TOKEN` deve ter somente permissão para disparar o workflow no repositório escolhido. Prefira GitHub App com instalação limitada quando a operação for colocada em produção.

### Deploy

O workflow manual [`.github/workflows/deploy-production.yml`](../.github/workflows/deploy-production.yml) usa um Environment chamado `production`, que deve exigir aprovação:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_DATABASE_URL
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
SENTRY_AUTH_TOKEN
FIREBASE_TOKEN
```

Nenhum desses valores deve ser colocado no código ou em `VITE_*` para uso pela automação de IA. O DSN web do GlitchTip continua sendo público por natureza; Auth Tokens não.

## Aprovação e deploy

O workflow de reparo cria somente um PR draft. Após revisão humana e aprovação, os checks obrigatórios devem passar. O deploy permanece manual, exige aprovação do Environment `production` e usa o fluxo existente:

```bash
npm run deploy:hosting
```

O workflow de produção não é chamado pelo workflow de reparo.

## Regras de segurança

A automação não pode:

- alterar `main` diretamente;
- executar deploy;
- acessar Firebase ou banco de dados;
- alterar Security Rules ou Authentication;
- ler ou alterar secrets;
- apagar dados;
- executar comandos arbitrários da IA;
- modificar dependências sem revisão;
- enviar PII, tokens, cookies, senhas, claims ou dados financeiros ao modelo.

Toda tentativa gera artefatos de diagnóstico no Actions. O histórico do PR registra o Issue, a análise, os arquivos e os resultados de validação.
