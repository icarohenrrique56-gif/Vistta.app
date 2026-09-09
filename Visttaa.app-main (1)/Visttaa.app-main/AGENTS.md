# AGENTS.md

## Visão geral
Este repositório é a aplicação VISTTA.app, construída em React + TypeScript + Vite + Firebase. O objetivo principal é manter a experiência de desenvolvimento consistente e reutilizar o ambiente local sem reinstalar dependências quando a conta do GitHub muda no mesmo computador.

## Regras operacionais
- Sempre prefira reutilizar `node_modules` e o cache do npm já existentes.
- Antes de executar `npm install`, verificar se a pasta `node_modules` existe.
- Quando necessário, usar `npm install --prefer-offline --no-audit --no-fund` em vez de reinstalar do zero.
- Manter os arquivos de ambiente local (`.env`) fora do controle de versão e reutilizáveis em cada conta.
- Documentar qualquer alteração de configuração em `.github/copilot-instructions.md` ou neste arquivo.

## Comandos principais
```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run build:all
```

## Estratégia para trocar de conta no GitHub sem reinstalar
1. O repositório já mantém `node_modules` localmente; não remover nem limpar a pasta a menos que seja necessário.
2. O arquivo `.npmrc` usa um cache global de dependências em `$HOME/.npm-cache/vistta` para acelerar reinstalações e evitar depender do ambiente anterior.
3. O script `scripts/bootstrap-repo.sh` verifica se o projeto já está bootstrapado antes de rodar o install.
4. Em contas diferentes, o devcontainer e o workspace continuam compartilhando o mesmo cache local do sistema.

## Prompt principal para Copilot e automações
"Reutilize o ambiente existente do projeto, mantenha `node_modules` e caches compartilhados, evite reinstalações desnecessárias, use `npm install --prefer-offline --no-audit --no-fund` apenas quando o projeto estiver sem dependências, e respeite as instruções de autenticação, Firebase e documentação do repositório."

## Funcionalidades internas e externas a conectar
- Firebase / Auth / Database
- Vite + React + TypeScript
- Cloud Functions / backend transacional
- Automação de issues e políticas
- Documentação de ambiente e deploy
- Fluxo de cadastros, financeiro, caixa e PDV

## Observações finais
- Não publicar chaves, tokens ou `.env` no Git.
- A configuração do ambiente deve ser persistida localmente e reaproveitada entre contas do GitHub.
