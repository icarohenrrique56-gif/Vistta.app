# Manutenção

- Manter Node 20 para Cloud Functions.
- Usar `npm ci` com os lockfiles versionados.
- Executar `npm run build:all` antes de deploy.
- Executar `npm audit` periodicamente e atualizar Firebase de forma coordenada.
- Criar backup/export do Realtime Database conforme política operacional do responsável.
- Testar restauração e regras em projeto separado antes de mudanças destrutivas.
- Não versionar `.env`, chaves privadas, `node_modules`, `dist` ou `functions/lib`.
