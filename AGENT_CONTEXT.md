# Magic AI — Agent Context Document

> **Purpose:** This document is the single source of truth for any AI agent or developer working on this project. Read this first before touching any code.

---

## 🚀 What Is This Project?

**Magic AI** is a developer productivity SaaS application. It bundles several everyday tools that developers use — all in one place with an AI-powered backend.

- **Target Users:** Software developers / freelancers
- **Monetization:** One-time lifetime payment ($5) via Stripe or Razorpay
- **Free Tier:** 50 AI feature uses per month, then paywalled
- **Live URL:** `https://magicaidevops.netlify.app`
- **Frontend:** React + Vite + TypeScript + TailwindCSS + shadcn/ui
- **Current Backend:** Supabase (Auth + DB + Edge Functions written in Deno/TypeScript)
- **Target Backend:** Node.js + Express + PostgreSQL (migration in progress)

---

## 🗂️ Project Structure

```
magic-ai/
├── src/
│   ├── App.tsx                    # Root app, all routes defined here
│   ├── main.tsx                   # Entry point
│   ├── contexts/
│   │   ├── AuthContext.tsx        # Auth state (user, session, signIn/signOut/signUp)
│   │   └── PaidStatusContext.tsx  # Global paid/free status tracker
│   ├── components/
│   │   ├── auth/AuthPage.tsx      # Login/Register UI
│   │   ├── profile/ProfilePage.tsx
│   │   ├── projects/              # ProjectCard, ProjectForm
│   │   ├── version-control/       # ConnectionStatus, RepositoryList
│   │   ├── CorrectSentence.tsx    # AI sentence corrector
│   │   ├── ClientUpdate.tsx       # AI client update generator
│   │   ├── TodaysUpdate.tsx       # AI daily update formatter
│   │   ├── CorrectLater.tsx       # Deferred correction tool
│   │   ├── Sidebar.tsx / Navigation.tsx / Layout.tsx
│   │   ├── NotificationBell.tsx   # Bell icon + notification list
│   │   └── UsageGate.tsx          # Wraps components to enforce usage limits
│   ├── pages/
│   │   ├── Index.tsx              # Dashboard / Home
│   │   ├── ProjectsPage.tsx       # Manage dev projects
│   │   ├── VersionControlPage.tsx # GitHub + GitLab integration
│   │   ├── RepoDetailsPage.tsx    # Repo detail with commits, branches
│   │   ├── StructureTemplatesPage.tsx # Custom output format templates
│   │   ├── PaymentPage.tsx        # Stripe/Razorpay payment UI
│   │   └── NotFound.tsx
│   ├── services/
│   │   ├── openaiService.ts       # All AI feature calls → Supabase Edge Functions
│   │   ├── projectService.ts      # CRUD for projects table
│   │   ├── notificationService.ts # CRUD for notifications table
│   │   ├── versionControlService.ts # GitHub/GitLab token & repo fetch
│   │   ├── calendarEventsService.ts # Google Calendar event storage
│   │   ├── googleAuthService.ts   # Google OAuth helpers
│   │   ├── googleCalendarService.ts # Google Calendar API calls
│   │   ├── gitActionsService.ts   # Git action helpers
│   │   └── slackService.ts        # Slack integration
│   ├── hooks/
│   │   ├── useUsageTracking.ts    # Tracks free usage count, paid status
│   │   └── useVersionControl.ts  # GitHub/GitLab state management hook
│   ├── integrations/supabase/
│   │   ├── client.ts              # Supabase JS client instance
│   │   └── types.ts               # Auto-generated DB types (all table schemas)
│   └── types/
│       ├── project.ts             # Project type definitions
│       └── googleCalendar.ts      # Google Calendar types
├── supabase/
│   ├── functions/                 # Deno Edge Functions (to be replaced by Node.js)
│   │   ├── get-openai-key/        # Main AI handler (all AI actions)
│   │   ├── github-oauth/          # GitHub OAuth flow (start + callback)
│   │   ├── gitlab-oauth/          # GitLab OAuth flow
│   │   ├── github-data/           # Fetch user GitHub repos + repo details
│   │   ├── gitlab-data/           # Fetch user GitLab projects
│   │   ├── common-git-action/     # Perform git operations
│   │   ├── create-razorpay-order/ # Create Razorpay payment order
│   │   ├── create-stripe-checkout/# Create Stripe checkout session
│   │   ├── stripe-webhook-unlock/ # Stripe webhook → marks user as paid
│   │   └── verify-razorpay-payment/ # Verify Razorpay signature → marks paid
│   └── migrations/                # PostgreSQL schema migrations (7 files)
└── public/
```

---

## 🗃️ Database Schema (PostgreSQL)

All tables live in the `public` schema.

### `profiles`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK, FK → auth.users |
| full_name | TEXT | |
| username | TEXT | UNIQUE |
| avatar_url | TEXT | |
| paid_user | BOOLEAN | Default false. Set to true after payment. |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### `projects`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| name | TEXT | Required |
| description | TEXT | |
| status | TEXT | e.g., "active", "completed" |
| client_name | TEXT | |
| client_email | TEXT | |
| last_update_sent | TIMESTAMPTZ | |
| update_frequency_days | INTEGER | |
| created_at / updated_at | TIMESTAMPTZ | |

### `notifications`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK |
| title | TEXT | |
| message | TEXT | |
| type | TEXT | |
| is_read | BOOLEAN | |
| is_dismissed | BOOLEAN | |
| project_id | UUID | FK → projects (nullable) |
| scheduled_for | TIMESTAMPTZ | |
| created_at / updated_at | TIMESTAMPTZ | |

### `feature_usage`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK |
| feature_name | TEXT | e.g., "correct_sentence" |
| usage_count | INTEGER | |
| last_used_at | TIMESTAMPTZ | |
| reset_date | TIMESTAMPTZ | Monthly reset |
| created_at / updated_at | TIMESTAMPTZ | |

### `payment_records`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK |
| payment_provider | TEXT | "stripe" or "razorpay" |
| payment_id | TEXT | Provider's order/session ID |
| amount | NUMERIC | |
| currency | TEXT | |
| status | TEXT | "pending", "success" |
| created_at / updated_at | TIMESTAMPTZ | |

### `structure_templates`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK |
| name | TEXT | Template name |
| template_content | TEXT | Template text/markup |
| created_at / updated_at | TIMESTAMPTZ | |

### `user_github_tokens`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK, UNIQUE |
| access_token | TEXT | |
| refresh_token | TEXT | |
| token_type | TEXT | |
| scope | TEXT | |
| expires_at | TIMESTAMPTZ | |
| connected | BOOLEAN | |
| created_at / updated_at | TIMESTAMPTZ | |

### `user_gitlab_tokens`
Similar structure to `user_github_tokens`.

### `user_google_tokens`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK, UNIQUE |
| access_token | TEXT | |
| refresh_token | TEXT | |
| expires_at | TIMESTAMPTZ | Required |
| created_at / updated_at | TIMESTAMPTZ | |

### `user_secrets`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK |
| secret_name | TEXT | |
| secret_value | TEXT | |
| created_at / updated_at | TIMESTAMPTZ | UNIQUE(user_id, secret_name) |

---

## ⚙️ PostgreSQL Functions (Server-side Logic)

| Function | Purpose |
|---|---|
| `increment_feature_usage(p_user_id, p_feature_name)` | Upserts feature_usage row, returns new count |
| `get_total_usage(p_user_id)` | Returns SUM of all usage_count for user |
| `reset_feature_usage_monthly()` | Resets usage counts on monthly cadence |
| `generate_project_update_notifications()` | Auto-generates notifications for overdue updates |

---

## 🧩 Core Features

### 1. **AI Sentence Corrector** (`/correct-sentence`)
- User types a sentence → AI corrects grammar/spelling
- Uses OpenAI `gpt-4o-mini` via backend
- Supports "Refresh" to get another variation
- Tracked in `feature_usage` table

### 2. **AI Client Update Generator** (`/client-update`)
- User provides: message, client name, live link, sender name
- AI generates a professional client-facing update email/message
- Supports refresh for alternatives
- Tracked in `feature_usage`

### 3. **AI Daily Update Formatter** (`/todays-update`)
- User dumps rough notes of daily work
- AI formats into 4 template styles (Clean & Structured, Table, Priority-Based, Categorized with Emojis)
- Output can be copied for Slack/Teams/Email

### 4. **Structure Templates** (`/structure-templates`)
- Users create custom output format templates
- Templates stored in DB per user
- Used by AI to format content in their preferred style

### 5. **Project Manager** (`/projects`)
- CRUD for developer projects
- Tracks: name, description, status, client name/email
- Supports sending client updates with configurable frequency

### 6. **Version Control Integration** (`/version-control`)
- GitHub OAuth → stores `access_token` in `user_github_tokens`
- GitLab OAuth → stores `access_token` in `user_gitlab_tokens`
- Displays all repos/projects per provider
- Repo details page: commits, branches, file tree
- Git actions (clone, branch, commit, etc.) via `common-git-action` function

### 7. **Google Calendar Integration**
- Google OAuth via client-side GAPI
- Syncs calendar events to `user_calendar_events` table
- Shows events in the dashboard

### 8. **Notifications** (Bell icon)
- Auto-generated project update reminders
- Manual notifications stored in DB
- Bell badge shows unread count

### 9. **Usage Tracking & Paywall**
- Free users: 50 total AI uses/month
- `useUsageTracking` hook manages state
- `UsageGate` component wraps paywalled content
- After payment: `paid_user = true` in profiles table → unlimited access

### 10. **Payment** (`/payment`)
- Stripe: `create-stripe-checkout` → user redirected → webhook `stripe-webhook-unlock` sets paid
- Razorpay: `create-razorpay-order` → frontend collects card → `verify-razorpay-payment` validates signature → sets paid
- One-time lifetime price: $5 USD

---

## 🔐 Authentication Flow

**Current (Supabase Auth):**
1. User registers via email/password → Supabase creates `auth.users` row → trigger creates `profiles` row
2. `AuthContext.tsx` listens to `supabase.auth.onAuthStateChange`
3. JWT token stored in browser (localStorage/cookies by Supabase)
4. All API calls send `Authorization: Bearer <jwt>` header
5. Edge functions validate JWT using `supabase.auth.getUser(token)`

**Target (Node.js Backend):**
- JWT-based auth using `jsonwebtoken` library
- `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` endpoints
- Passwords hashed with `bcrypt`
- JWT stored in HttpOnly cookie or returned as Bearer token

---

## 🔄 AI Actions Reference

All AI actions go through a single endpoint. Action names:

| Action | Input Fields | Response Field |
|---|---|---|
| `correct_sentence` | `sentence`, `isRefresh` | `correctedSentence` |
| `generate_prompt` | `keywords` | `generatedPrompt` |
| `generate_client_update` | `message`, `clientName`, `liveLink`, `yourName`, `isRefresh` | `clientUpdate` |
| `format_daily_update` | `updateText`, `isRefresh` | `formattedUpdate` |
| `generate_commit_message` | `commitSummary` | `commitMessage` |
| `format_with_template` | `content`, `template` | `formattedContent` |

---

## 🌐 Environment Variables

### Frontend (`.env`)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_GOOGLE_CLIENT_ID=...
# After migration:
VITE_API_BASE_URL=http://localhost:4000/api
```

### Backend (Supabase Secrets → will become Node.js `.env`)
```
OPENAI_API_KEY=sk-...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITLAB_CLIENT_ID=...
GITLAB_CLIENT_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
APP_URL=https://...
FRONTEND_URL=https://magicaidevops.netlify.app
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=...
```

---

## 🏗️ Migration Plan: Supabase → Node.js + PostgreSQL

> See `BACKEND_MIGRATION_PLAN.md` for the detailed step-by-step plan.

**Summary of what needs to change:**
1. **Auth**: Replace Supabase Auth with custom JWT auth (bcrypt + jsonwebtoken)
2. **Database**: Keep PostgreSQL schema, connect via `pg` or `prisma`
3. **Edge Functions → Express Routes**: Each Supabase function becomes an Express route
4. **Frontend Services**: Replace `supabase.from(...)` calls with `fetch('/api/...')`
5. **AuthContext**: Replace `supabase.auth.*` with REST API calls to Node.js backend

---

## 📦 Tech Stack Summary

| Layer | Current | Target |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | Same |
| UI | shadcn/ui + TailwindCSS + Radix UI | Same |
| State | React Context + TanStack Query | Same |
| Auth | Supabase Auth | Node.js JWT (bcrypt + jsonwebtoken) |
| Database | Supabase (PostgreSQL) | PostgreSQL (direct) |
| ORM/Query | Supabase JS Client | pg / Prisma |
| Backend | Supabase Edge Functions (Deno) | Node.js + Express |
| AI | OpenAI gpt-4o-mini | Same |
| Payments | Stripe + Razorpay | Same (via Node.js routes) |
| Hosting | Netlify (frontend) | Netlify + separate Node.js host |

---

## 🔑 Key Business Rules

1. **Free limit**: 50 AI feature uses per month. Tracked in `feature_usage`.
2. **Paid unlock**: One-time $5 payment → `profiles.paid_user = true` → unlimited forever.
3. **Monthly reset**: `feature_usage` reset monthly (via PostgreSQL function).
4. **Protected routes**: All feature pages require authentication.
5. **OAuth tokens**: GitHub/GitLab tokens stored encrypted in DB. One token per user per provider.
6. **Paid routes**: Some routes check `isPaidUser` before allowing access.
