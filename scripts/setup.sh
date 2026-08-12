#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_DIR}"

printf '\n==============================================\n'
printf '     BulkMailer Frontend Setup\n'
printf '==============================================\n\n'

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js 22.12+ is required." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm 10+ is required." >&2
  exit 1
fi

NODE_MAJOR="$(node -p "parseInt(process.versions.node.split('.')[0], 10)")"
if [ "${NODE_MAJOR}" -lt 22 ]; then
  echo "Error: Node.js must be version 22.12 or newer." >&2
  exit 1
fi

echo "1/3 Installing locked dependencies..."
npm ci

echo "2/3 Preparing environment..."
if [ ! -f .env ]; then
  if [ ! -f .env.example ]; then
    echo "Error: .env.example is missing." >&2
    exit 1
  fi
  cp .env.example .env
  echo "Created .env from .env.example."
else
  echo ".env already exists; keeping the current configuration."
fi

echo "3/3 Validating the production build..."
npm run check

printf '\n==============================================\n'
printf ' Frontend setup completed successfully.\n'
printf ' Start the web app with: npm run dev\n'
printf ' URL: http://localhost:3000\n'
printf '==============================================\n\n'

