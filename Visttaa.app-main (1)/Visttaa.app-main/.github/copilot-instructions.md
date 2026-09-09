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

## Prompt operacional
"Conecte as partes internas e externas do projeto (frontend, backend, Firebase, automações, documentação e tooling), reutilize o estado local do ambiente, evite reinstalações dispensáveis, e preserve a continuidade do setup ao trocar de conta no GitHub."

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
