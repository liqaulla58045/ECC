# Enterprise Command Center

A full-stack executive dashboard for the Chairman — built with React (Vite) on the frontend and an MCP server on the backend for live StartupVarsity data.

---

## 🏗️ Project Structure

```
-Enterprise-Command-Center/
├── frontend/              ← React + Vite Chairman Dashboard (Blossom UI)
│   ├── src/
│   │   ├── pages/         ← LoginPage, DashboardPage, ProjectDetailPage
│   │   ├── components/    ← ProjectCard, AddProductModal (Wizard), ChatBot
│   │   ├── styles/        ← Premium Blossom UI Styles (Orange/White)
│   │   └── data/          ← mockData.js (Project/KPI definitions)
│   └── package.json
│
└── backend/
    └── mcp-server/        ← MCP server (StartupVarsity live data)
        ├── server.ts      ← 20+ tools: stats, teams, applications, etc.
        ├── package.json
        └── tsconfig.json
```

---

## 🎨 Design System: Blossom UI
The dashboard uses the **Blossom UI** aesthetic:
- **Primary Accent**: Blossom Orange (`#D14931`)
- **Theme**: Light/Neutral with a clean White sidebar.
- **Typography**: Plus Jakarta Sans & Inter.
- **Border Radius**: 20px (Modern/Premium feel).

---

## 🚀 Getting Started

### 1. Backend (MCP Server)
The MCP (Model Context Protocol) server exposes live StartupVarsity admin data via Playwright browser automation.

**Setup:**
```bash
cd backend/mcp-server
npm install
npx playwright install chromium
```

**Configuration:**
Create a `.env` file in `backend/mcp-server/`:
```env
SV_EMAIL=your-admin@email.com
SV_PASSWORD=your-password
```

**Run:**
```bash
npm run dev
```

### 2. Frontend
**Setup & Run:**
```bash
cd frontend
npm install
npm run dev
```
Open → **http://localhost:5173**
Login: `chairman` / `chairman@123`

---

## 🛠️ Available MCP Tools (StartupVarsity)

| Tool | Description |
|------|-------------|
| `get_dashboard_stats` | Total users, teams, learners, mentors, active cohorts |
| `get_cohort_stats` | Sprint progress, team health breakdown |
| `get_notifications` | All admin notifications |
| `get_unread_notification_count` | Count of unread notifications |
| `get_all_applications` | All application types (FOUNDER/COFOUNDER/LEARNER/etc.) |
| `get_users` | All registered users |
| `get_teams` | All startup teams with health status |
| `get_cohorts` | All cohorts with sprint schedule |
| `get_full_dashboard_summary` | Aggregate stats + cohorts + notifications (parallel) |
| `get_health_report` | Teams + cohort stats + notifications health overview |

---

## 🛣️ Roadmap
- [x] Implement Blossom UI redesign across all pages.
- [x] Connect frontend to MCP server via Express API layer.
- [ ] Implement persistent project management (dynamic connections).
- [ ] Add real-time notification polling.
- [ ] Deploy production build.
