# Deploy

## Frontend

```bash
npm ci
cp .env.example .env
# preencher VITE_FIREBASE_* com o projeto correto
npm run build
npm run preview
```

Publique o conteúdo de `dist` no hosting escolhido. Configure HTTPS e domínio final.

## Firebase

```bash
npm ci --prefix functions
npm run build:all
npx firebase deploy --only functions,database
```

Antes do lançamento, validar Node 20, Authentication providers, Authorized domains, API key restrictions e regras no projeto correto.
