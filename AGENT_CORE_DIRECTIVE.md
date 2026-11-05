# AGENT CORE DIRECTIVE — Magic AI (Developer Operations Platform)

> **CRITICAL FOR ALL AI AGENTS & DEVELOPERS:**
> Read this directive before touching any navigation, routes, sidebar, or UI components.
> **DO NOT** deviate from the instructions below.

---

## 🚫 1. STRICT PRODUCT SCOPE — DO NOT RE-INTRODUCE REMOVED FEATURES

The product is **NOT** a text polisher, sentence corrector, or generic writing assistant. 
All legacy "AI Productivity" modules have been **permanently decommissioned from the navigation and UI**.

### ❌ NEVER DISPLAY OR ADD BACK TO UI:
* ❌ **PR & Commit Studio / Correct Sentence** (`CorrectSentence.tsx`)
* ❌ **Daily Standup / Today's Update** (`TodaysUpdate.tsx`)
* ❌ **Client Progress Hub** (`ClientUpdate.tsx`)
* ❌ **Structure Templates** (`StructureTemplatesPage.tsx`)
* ❌ **Projects Manager** (`ProjectsPage.tsx`)
* ❌ **"AI Productivity" group headers** in Sidebar, Navigation, or Command Palette.

---

## ✅ 2. ONLY ALLOWED ACTIVE USER-FACING MODULES

The platform is strictly a **SaaS Developer Operations (DevOps) Platform**.

Only the following modules must exist in navigation, sidebar, and routing:

| Module | Route | Purpose |
|---|---|---|
| **Version Control Hub** | `/version-control` | GitHub & GitLab OAuth, repository listing, branches, commits, rollbacks, and AI README generator |
| **Repo Details** | `/version-control/github/:id`, `/version-control/gitlab/:id` | Repository inspector, commit history timeline, branch operations, and AI README architect |
| **Action Marketplace** | `/action-marketplace` | Curated CI/CD workflow catalog (GitHub Actions & GitLab CI), YAML preview, and direct commit to repo |
| **Auth** | `/auth` | Login & Registration |
| **Profile** | `/profile` | User credentials, provider connection status, and usage |
| **Payment** | `/payment` | Razorpay lifetime unlock checkout (₹499) |

---

## 🗺️ 3. UPCOMING ROADMAP & ARCHITECTURE

The definitive strategy baseline is documented in:
👉 [`public/PRODUCT_REQUIREMENTS_AND_TECHNICAL_ARCHITECTURE.md`](./public/PRODUCT_REQUIREMENTS_AND_TECHNICAL_ARCHITECTURE.md)

### Key Architectural Pillars:
1. **Repository-Centric & SaaS-First:**
   - Single source of truth is the user's connected Git repositories (GitHub App & GitLab OAuth).
2. **Pull Request Management (Planned):**
   - Unified PR inbox across GitHub & GitLab with approval flows and CI check status.
3. **VPS Server Agent & Deployments (Planned):**
   - User-owned Linux servers connected via a lightweight outbound agent.
   - Initial runtime: Docker & Docker Compose deployments from provider-built artifacts.
4. **Hybrid Monitoring (Planned):**
   - Server agent CPU/memory metrics + external HTTP uptime health checks.
5. **CI/CD Marketplace Expansion:**
   - Official verified workflow templates + community submissions with direct repository installation.
6. **AI is Repository-Centric & Optional:**
   - AI is ONLY used in context of repository operations (e.g. AI README Architect, workflow generation). Never standalone generic text tools.
