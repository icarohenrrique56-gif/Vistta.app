# Copilot instructions

Este repositório deve ser tratado como um ambiente de desenvolvimento persistente. Quando a conta do GitHub for trocada, reutilize o ambiente já instalado e não force reinstalação de dependências.

## Regras
- Se `node_modules` existir, use o ambiente atual.
- Se o projeto precisar de bootstrap, preferir:
  `npm install --prefer-offline --no-audit --no-fund`
- Não remover `node_modules` sem necessidade.
- Manter o cache do npm em `$HOME/.npm-cache/vistta` por meio do `.npmrc` do repositório.
- Respeitar a arquitetura do projeto: React, TypeScript, Firebase, Vite e Functions.
- Mantém a documentação técnica em `docs/` atualizada quando houver mudanças relevantes.
- Priorizar o plano Firebase Spark e custo R$ 0,00 sempre que tecnicamente possível.
- Nunca habilitar billing, migrar para Blaze ou ativar recursos pagos sem autorização explícita.
- Antes de usar Cloud Functions, Cloud Run, Storage, Firestore, extensões, APIs pagas ou serviços externos, verificar alternativas compatíveis com o Spark.
- Se uma funcionalidade exigir Blaze, não migrar: informar `ESTA FUNCIONALIDADE EXIGE BLAZE` e propor uma alternativa gratuita.
- Antes de deploys, revisar os serviços envolvidos e reduzir leituras, gravações, listeners, chamadas, tráfego e armazenamento desnecessários.

## Prompt operacional
"Conecte as partes internas e externas do projeto (frontend, backend, Firebase, automações, documentação e tooling), reutilize o estado local do ambiente, evite reinstalações dispensáveis, e preserve a continuidade do setup ao trocar de conta no GitHub."

"Mantenha o VISTTA no plano Firebase Spark por padrão. Nunca ative billing, faça upgrade para Blaze ou crie recursos pagos automaticamente. Identifique o custo antes de cada mudança, prefira alternativas gratuitas e informe `ESTA FUNCIONALIDADE EXIGE BLAZE` quando não houver alternativa compatível."

## Comandos recomendados
```bash
npm run typecheck
npm run build
npm run dev
```

Se faltar dependência ou `node_modules`:
```bash
./scripts/bootstrap-repo.sh
```
