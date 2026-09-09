#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ -d "$ROOT_DIR/node_modules" ]; then
  echo "Ambiente já encontrado em node_modules. Reutilizando instalação existente."
  exit 0
fi

npm install --prefer-offline --no-audit --no-fund
