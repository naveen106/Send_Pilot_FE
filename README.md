# BulkMailer — Frontend

BulkMailer is a React application for composing, scheduling, and monitoring bulk email campaigns through the BulkMailer API.

## Features

- Campaign creation with HTML editing, attachments, recipients, and flexible send modes
- Campaign search, pagination, details, retry, assignment, and deletion
- Dashboard statistics and delivery monitoring
- Contact management, deduplication, and CSV/XLSX imports
- Backend-connected authentication and session handling
- Responsive dark interface with reusable UI components
- Production-ready static deployment with Nginx

## Project Structure

```text
frontend/
├── public/                    # Static assets
├── src/                       # Main application source
│   ├── api/                   # API client and endpoint definitions
│   ├── components/            # Reusable UI and feature components
│   ├── context/               # Shared React state
│   ├── hooks/                 # Reusable React hooks
│   ├── pages/                 # Dashboard, campaign, contact, and import screens
│   ├── types/                 # Shared TypeScript types
│   ├── utils/                 # Formatting and email utilities
│   ├── App.tsx                # Routes and application composition
│   └── main.tsx               # Application entry point
├── docs/                      # Setup, run, and usage guides
│   ├── setup.md               # Installation and environment setup
│   ├── run.md                 # Start, stop, and check commands
│   └── Usage.md               # Short web app usage guide
├── .env.example               # Environment variable template
├── scripts/setup.sh           # Local setup automation
├── Dockerfile                 # Production container definition
├── nginx.conf                 # Static hosting and SPA fallback
├── package.json               # Dependencies and npm scripts
└── vite.config.ts             # Dev server and API proxy
```

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) `22.12` or newer
- npm `10` or newer
- BulkMailer backend running on port `5000`, unless `VITE_API_URL` points elsewhere

### Run the development app

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000). On PowerShell, use `Copy-Item .env.example .env` instead of `cp .env.example .env`.

For detailed instructions, see [`docs/setup.md`](docs/setup.md), [`docs/run.md`](docs/run.md), and [`docs/Usage.md`](docs/Usage.md).

### One-command setup

```bash
bash scripts/setup.sh
```

The script installs the locked dependencies, preserves an existing `.env`, and validates a production build. If `.env` does not exist, it copies `.env.example` as a starting template. It is safe to rerun. Start the web app afterward with `npm run dev`.

### Build and preview

```bash
npm run build
npm run preview
```

The production output is written to [`dist/`](dist/).

### Run with Docker

```bash
docker build --build-arg VITE_API_URL=/api -t bulkmailer-frontend .
docker run --rm -p 8080:80 bulkmailer-frontend
```

Open [http://localhost:8080](http://localhost:8080).

The image uses Node `24.18.0` for the build stage and Nginx `1.27-alpine` to serve the compiled application. It also exposes a health endpoint at [http://localhost:8080/health](http://localhost:8080/health), which returns `ok` when the container is serving correctly.

The Docker image was verified with the current dependency lockfile and production build. Both the root application route and `/health` returned HTTP `200`.

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Starts the Vite development server on port `3000`. |
| `npm run build` | Type-checks and creates an optimized build in [`dist/`](dist/). |
| `npm run check` | Runs the same validation and build pipeline as `npm run build`. |
| `npm run preview` | Serves the latest production build locally. |

## Configuration

Environment variables are read at build time by Vite. Copy [`.env.example`](.env.example) to [`.env`](.env) and set:

| Variable | Description | Development default |
| --- | --- | --- |
| `VITE_API_URL` | Backend API base URL. | `/api` through the Vite proxy |

```env
# Local development through the Vite proxy
VITE_API_URL=

# Direct API connection
VITE_API_URL=https://api.example.com/api
```

For Docker deployments, pass `VITE_API_URL` as a build argument because Vite embeds it into the generated bundle. Use `/api` when a reverse proxy routes API requests to the backend, or provide the backend's full public URL for a standalone frontend deployment.

## Backend Integration

The request layer is centralized in [`src/api/client.ts`](src/api/client.ts), and endpoint definitions live in [`src/api/index.ts`](src/api/index.ts). Authenticated requests use the application session token; expired sessions are refreshed when possible and unauthenticated responses redirect to `/login`.

## Engineering Notes

- Keep route-level behavior in [`src/pages/`](src/pages/) and reusable presentation in [`src/components/`](src/components/).
- Add backend calls to the appropriate API module before wiring them into a page.
- Run `npm run check` before opening a pull request.
- Do not commit `.env` files or production credentials.

## License

This project is private and intended for internal use.
