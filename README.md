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
│   ├── client.ts        # Axios instance — baseURL from VITE_API_URL, JWT interceptor, 401 redirect
│   ├── index.ts         # All API endpoint functions (authApi, campaignsApi, contactsApi, dashboardApi)
│   └── mockAuth.ts      # In-memory mock users; activated automatically on 5xx/no-response
├── components/
│   ├── campaigns/
│   │   ├── ComposeForm.tsx         # New campaign compose panel (form, tag input, attachments, send mode)
│   │   ├── CampaignTable.tsx       # Campaign list table with multi-select and delete
│   │   ├── CampaignDetailModal.tsx # Full-screen campaign detail overlay with retry/delete
│   │   └── SendModeMenu.tsx        # Split-button dropdown for immediate/scheduled/interval mode
│   ├── layout/
│   │   ├── Layout.tsx              # Sidebar + <Outlet> shell; nav filtered by role
│   │   └── ProtectedRoute.tsx      # Auth guard + optional role guard; redirects to /login or /dashboard
│   ├── ConfirmDialog.tsx           # Reusable destructive-action modal
│   ├── EmptyState.tsx              # Centered empty-state block (icon, message, hint)
│   ├── PageHeader.tsx              # Two-line page header (icon, label, title)
│   └── StatusBadge.tsx             # Campaign status pill badge with color mapping
├── context/
│   └── AuthContext.tsx  # Auth state (user, token), login/logout/register/forgotPassword/resetPassword, hasRole()
├── hooks/
│   ├── useClickOutside.ts  # Calls handler on mousedown outside a ref — closes dropdowns/menus
│   ├── usePolling.ts       # Runs a callback on interval while active; clears on cleanup
│   └── useSelection.ts     # Multi-select state (toggle, toggleAll, clear, allSelected, someSelected)
├── pages/
│   ├── LoginPage.tsx           # Email + password sign-in form
│   ├── DashboardPage.tsx       # Stats grid (totalEmails, sentToday, scheduledCampaigns, totalCampaigns)
│   ├── CampaignsPage.tsx       # Campaign list, compose form, send-mode picker, detail modal, delete confirm
│   ├── ContactsPage.tsx        # Contact list + add form (tab: contacts) / CSV-XLSX import (tab: imports)
│   └── ResetPasswordPage.tsx   # Token-based password reset form
├── types/
│   └── index.ts         # Shared TS types: Role, SendMode, User, AuthState, Campaign, Contact, DashboardStats
├── App.tsx              # BrowserRouter + route tree + Toaster config
├── index.css            # Tailwind directives + @layer components (glass, btn-primary, btn-ghost, badge, input-field, table-row)
└── main.tsx             # ReactDOM.createRoot entry point
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
