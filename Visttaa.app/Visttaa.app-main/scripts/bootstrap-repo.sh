#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -d "$ROOT_DIR/node_modules" ]; then
  npm install --prefer-offline --no-audit --no-fund
else
  echo "Ambiente principal já encontrado em node_modules. Reutilizando instalação existente."
fi

if [ ! -d "$ROOT_DIR/functions/node_modules" ]; then
  npm install --prefix functions --prefer-offline --no-audit --no-fund
else
  echo "Dependências do backend já encontradas em functions/node_modules. Reutilizando instalação existente."
fi
