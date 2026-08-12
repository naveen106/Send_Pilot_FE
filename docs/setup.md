# Frontend Setup

This guide prepares the BulkMailer web application for local development.

## Prerequisites

- Node.js 22.12 or newer
- npm 10 or newer
- BulkMailer backend available at http://localhost:5000, unless VITE_API_URL is changed

## Setup

From the frontend repository root:

~~~bash
bash scripts/setup.sh
~~~

The script:

1. Installs dependencies with npm ci.
2. Uses the existing .env when it is present.
3. Copies .env.example to .env only when .env does not exist.
4. Runs the production build check.

[.env.example](../.env.example) is only a configuration template. If [.env](../.env) already contains values, it is kept unchanged.

If the script is not executable on Linux or macOS:

~~~bash
chmod +x scripts/setup.sh
bash scripts/setup.sh
~~~

## Manual setup

~~~bash
npm ci
npm run check
~~~

For local development, set VITE_API_URL= to use the Vite proxy, or set it to a complete backend API URL.

