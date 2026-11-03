# magic‑ai <a href="https://github.com/Pika003/magic-ai"><img src="https://img.shields.io/github/stars/Pika003/magic-ai?style=flat-square" alt="Stars"></a> <a href="https://github.com/Pika003/magic-ai"><img src="https://img.shields.io/github/forks/Pika003/magic-ai?style=flat-square" alt="Forks"></a> <a href="https://github.com/Pika003/magic-ai/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Pika003/magic-ai?style=flat-square" alt="License"></a>

---

## 📖 Overview

**magic‑ai** is a full‑stack web application that lets users generate, visualise, and export AI‑driven insights.  
The project started with a Supabase backend and has now been migrated to a custom **Node.js + Express** server (Phase 4 & 5). It provides a clean TypeScript/React front‑end, server‑side PDF export with embedded charts, and a PostgreSQL database powered by PL/pgSQL stored procedures.

---

## ✨ Features

- **AI‑powered content generation** – interact with the backend via a simple REST API.  
- **Phase‑based migration** – Supabase → custom Node.js/Express backend (Phases 1‑5).  
- **PDF export** – generate downloadable PDFs that include dynamically rendered graphs.  
- **Responsive UI** – built with TypeScript, React, and modern CSS.  
- **Database logic** – complex data handling encapsulated in PL/pgSQL functions.  
- **Live “Today’s Update” component** – auto‑refreshes with the latest AI insights.  

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Front‑end** | TypeScript, React, JavaScript, HTML5, CSS (Flexbox/Grid) |
| **Back‑end** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL, PL/pgSQL |
| **PDF / Charts** | `pdfkit` (or similar), `chart.js`/`recharts` |
| **Package Management** | npm / yarn |
| **Version Control** | Git (GitHub) |
| **CI/CD (optional)** | GitHub Actions (not yet configured) |

---

## 🚀 Getting Started

### Prerequisites

| Tool | Minimum version |
|------|-----------------|
| Node.js | 18.x |
| npm or Yarn | 9.x |
| PostgreSQL | 14.x |
| Git | 2.30+ |

### Installation

```bash
# Clone the repository
git clone https://github.com/Pika003/magic-ai.git
cd magic-ai

# Install front‑end dependencies
cd client
npm install   # or `yarn`

# Install back‑end dependencies
cd ../server
npm install   # or `yarn`
```

### Database Setup

1. Create a PostgreSQL database (e.g., `magic_ai_db`).  
2. Run the provided schema and PL/pgSQL scripts:

```bash
psql -U <your_user> -d magic_ai_db -f ./server/db/schema.sql
psql -U <your_user> -d magic_ai_db -f ./server/db/functions.sql
```

3. Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env   # in both `client` and `server` directories
# edit .env with your DB connection string, JWT secret, etc.
```

### Running the Application

#### Development mode

```bash
# Terminal 1 – start the backend API
cd server
npm run dev   # uses nodemon, runs on http://localhost:4000

# Terminal 2 – start the front‑end dev server
cd ../client
npm start     # runs on http://localhost:3000
```

#### Production build

```bash
# Build the front‑end
cd client
npm run build   # outputs to `client/build`

# Serve the built assets with Express (already configured)
cd ../server
npm run start   # Node runs on PORT defined in .env (default 4000)
```

Visit `http://localhost:3000` (dev) or `http://localhost:4000` (prod) to interact with **magic‑ai**.

---

## 📂 Project Structure

```
magic-ai/
├─ client/                 # React front‑end
│  ├─ src/
│  │  ├─ components/       # UI components (e.g., TodaysUpdate, ExportToPdf)
│  │  ├─ pages/            # Route‑level pages
│  │  ├─ hooks/            # Custom React hooks
│  │  └─ App.tsx
│  ├─ public/
│  ├─ package.json
│  └─ tsconfig.json
├─ server/                 # Node.js/Express back‑end
│  ├─ src/
│  │  ├─ controllers/      # Request handlers
│  │  ├─ routes/           # API route definitions
│  │  ├─ services/         # Business logic, PDF generation, chart data
│  │  ├─ db/               # DB helper, query wrappers
│  │  └─ index.ts
│  ├─ db/
│  │  ├─ schema.sql        # Table definitions
│  │  └─ functions.sql     # PL/pgSQL stored procedures
│  ├─ .env.example
│  ├─ package.json
│  └─ tsconfig.json
├─ .github/                # GitHub Actions (future CI)
├─ .gitignore
└─ README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository and create a new branch for your feature or bug‑fix.  
2. Follow the existing code style (TypeScript linting, Prettier).  
3. Write unit/integration tests where applicable (`npm test`).  
4. Ensure the app builds and all tests pass.  
5. Open a **Pull Request** with a clear description and reference any related issue.

### Development Guidelines

- Keep the front‑end UI logic separate from API calls.  
- Add or update PL/pgSQL functions in `server/db/functions.sql` and version them with migration scripts.  
- When adding new endpoints, document them in `server/src/routes/README.md`.  
- Run `npm run lint` and `npm run format` before committing.

---

## 📄 License

Distributed under the **MIT License**. See the `LICENSE` file for more details.