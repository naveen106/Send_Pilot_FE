# BulkMailer — Frontend

A dark-themed bulk email management platform built with React, TypeScript, and Tailwind CSS.

---

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** — dev server & bundler
- **Tailwind CSS** — styling
- **React Router v6** — routing
- **Axios** — HTTP client
- **React Hot Toast** — notifications
- **Lucide React** — icons

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/monkhaihq/bulk-email-sender-fe.git
cd frontend

# 2. Install dependencies
npm install
```

---

## Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `/api` |

> If `VITE_API_URL` is left empty, Vite will proxy `/api` requests to the backend (see `vite.config.ts`).

---

## Running Locally

```bash
npm run dev
```

App will be available at `http://localhost:3000`.

---

## Building for Production

```bash
npm run build
```

Output is generated in the `dist/` folder. To preview the production build locally:

```bash
npm run preview
```

---

## Project Structure

```
src/
├── api/
│   ├── client.ts        # Axios instance with auth interceptors
│   ├── index.ts         # All API endpoint functions
│   └── mockAuth.ts      # Mock auth fallback (used when backend is down)
├── components/
│   └── layout/
│       ├── Layout.tsx         # Sidebar + main content shell
│       └── ProtectedRoute.tsx # Auth & role guard wrapper
├── context/
│   └── AuthContext.tsx  # Auth state, login, logout, role helpers
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── CampaignsPage.tsx
│   ├── ContactsPage.tsx
│   ├── UsersPage.tsx
│   ├── SmtpPage.tsx
│   ├── SchedulerPage.tsx
│   └── AppLogsPage.tsx
├── types/
│   └── index.ts         # Shared TypeScript types
├── App.tsx              # Routes definition
├── main.tsx             # Entry point
└── index.css            # Tailwind + global styles
```

---

## Roles & Access

| Role | Dashboard | Campaigns | Contacts | Users | SMTP | Logs | Scheduler |
|---|---|---|---|---|---|---|---|
| `ADMIN` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `MANAGER` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `USER` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Mock Auth (Offline Mode)

When the backend is unreachable (5xx or no response), the app automatically falls back to a local mock. Test credentials:

| Email | Password | Role |
|---|---|---|
| `admin@test.com` | `admin123` | ADMIN |
| `manager@test.com` | `manager123` | MANAGER |
| `user@test.com` | `user123` | USER |

---

## Connecting to the Backend

Set `VITE_API_URL` in your `.env` to point to your running backend:

```env
VITE_API_URL=http://localhost:5000/api
```

The API client automatically attaches the JWT token from `localStorage` to every request and redirects to `/login` on `401` responses.
