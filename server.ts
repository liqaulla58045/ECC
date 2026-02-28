import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { chromium, Browser, BrowserContext, Page } from "playwright";
import { config } from "dotenv";

// ─────────────────────────────────────────────
// Load .env
// ─────────────────────────────────────────────
config();

const SV_EMAIL = process.env.SV_EMAIL;
const SV_PASSWORD = process.env.SV_PASSWORD;
const BASE_URL = "https://www.startupvarsity.com";

if (!SV_EMAIL || !SV_PASSWORD) {
  console.error("❌ Missing SV_EMAIL or SV_PASSWORD in .env file");
  process.exit(1);
}

// ─────────────────────────────────────────────
// Auth & Browser state
// ─────────────────────────────────────────────
let browser: Browser | null = null;
let context: BrowserContext | null = null;
let page: Page | null = null;
let isLoggedIn = false;

// ─────────────────────────────────────────────
// Boot: open browser + auto-login on startup
// ─────────────────────────────────────────────
async function initBrowser() {
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext();
  page = await context.newPage();

  console.error("🌐 Browser launched, logging in...");
  await performLogin(SV_EMAIL!, SV_PASSWORD!);
}

async function performLogin(email: string, password: string): Promise<boolean> {
  if (!page) throw new Error("Browser not initialized");

  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });

  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button[type="submit"]');

  try {
    await page.waitForNavigation({ waitUntil: "networkidle", timeout: 10000 });
  } catch {
    // SPA may not fire a full navigation event
  }

  const currentUrl = page.url();
  if (currentUrl.includes("/login")) {
    console.error("❌ Login failed — check SV_EMAIL and SV_PASSWORD in .env");
    return false;
  }

  // Wait briefly for session cookies to settle
  await page.waitForTimeout(2000);
  isLoggedIn = true;
  console.error(`✅ Logged in (cookie-based auth).`);
  return true;
}

// ─────────────────────────────────────────────
// Core API caller — uses browser session cookies
// ─────────────────────────────────────────────
async function apiGet(path: string): Promise<unknown> {
  if (!page) throw new Error("Browser not initialized.");
  if (!isLoggedIn) throw new Error("Not logged in. Call login first.");

  const result = await page.evaluate(
    async (url: string) => {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      });

      const text = await res.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      return { ok: res.ok, status: res.status, data };
    },
    `${BASE_URL}${path}`
  );

  if (!result.ok) {
    throw new Error(
      `API ${path} returned ${result.status}: ${JSON.stringify(result.data)}`
    );
  }

  return result.data;
}

// ─────────────────────────────────────────────
// MCP Server
// ─────────────────────────────────────────────
const server = new Server(
  { name: "startupvarsity-admin-mcp", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

// ─────────────────────────────────────────────
// Tool Definitions
// ─────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [

    // ── AUTH ─────────────────────────────────────────────────────────────
    {
      name: "login",
      description:
        "Manually re-authenticate to StartupVarsity. Auto-login runs on startup from .env. Only call this if the session has expired.",
      inputSchema: {
        type: "object",
        properties: {
          email:    { type: "string", description: "Admin email (optional — defaults to .env)" },
          password: { type: "string", description: "Admin password (optional — defaults to .env)" },
        },
      },
    },

    // ── DASHBOARD ────────────────────────────────────────────────────────
    {
      name: "get_dashboard_stats",
      description:
        "Top-level admin dashboard stats: Total Users, Teams, Learners, Mentors, Applications, Seed Deployed (₹), Stipends Disbursed (₹), Active Cohorts. → /api/admin/stats",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_cohort_stats",
      description:
        "Cohort-level stats including sprint progress, team health breakdown, and active cohort details. → /api/admin/cohort-stats",
      inputSchema: { type: "object", properties: {} },
    },

    // ── NOTIFICATIONS ─────────────────────────────────────────────────────
    {
      name: "get_notifications",
      description:
        "Full list of admin notifications. → /api/admin/notifications",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_unread_notification_count",
      description:
        "Count of unread admin notifications. → /api/admin/notifications/unread",
      inputSchema: { type: "object", properties: {} },
    },

    // ── APPLICATIONS ──────────────────────────────────────────────────────
    {
      name: "get_recent_applications",
      description:
        "Most recent applications across all types. → /api/admin/recent-applications",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_applications_by_type",
      description:
        "Applications filtered by type: FOUNDER | COFOUNDER | LEARNER | TEAM | MENTOR. → /api/admin/applications?type=<TYPE>",
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["FOUNDER", "COFOUNDER", "LEARNER", "TEAM", "MENTOR"],
            description: "Applicant type",
          },
        },
        required: ["type"],
      },
    },
    {
      name: "get_all_applications",
      description:
        "All applications across FOUNDER, COFOUNDER, LEARNER, TEAM, MENTOR in one call (5 parallel requests).",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_team_applications",
      description:
        "Team-level group applications. → /api/admin/team-applications",
      inputSchema: { type: "object", properties: {} },
    },

    // ── USERS ─────────────────────────────────────────────────────────────
    {
      name: "get_users",
      description:
        "All registered users with roles, status, and profile data. → /api/admin/users",
      inputSchema: { type: "object", properties: {} },
    },

    // ── TEAMS ─────────────────────────────────────────────────────────────
    {
      name: "get_teams",
      description:
        "All startup teams with health status (Green/Amber/Red), sprint progress, and member info. → /api/teams",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_my_team",
      description:
        "The team associated with the logged-in admin account (if any). → /api/my-team",
      inputSchema: { type: "object", properties: {} },
    },

    // ── COHORTS ───────────────────────────────────────────────────────────
    {
      name: "get_cohorts",
      description:
        "All cohorts with status, sprint schedule, enrolled teams, and duration. → /api/cohorts",
      inputSchema: { type: "object", properties: {} },
    },

    // ── PROBLEM STATEMENTS ────────────────────────────────────────────────
    {
      name: "get_problem_statements",
      description:
        "All problem statements regardless of status. → /api/problem-statements",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_published_problem_statements",
      description:
        "Only PUBLISHED problem statements visible to participants. → /api/problem-statements?status=PUBLISHED",
      inputSchema: { type: "object", properties: {} },
    },

    // ── JOB POSTINGS ──────────────────────────────────────────────────────
    {
      name: "get_job_postings",
      description:
        "All job postings listed on the platform. → /api/admin/job-postings",
      inputSchema: { type: "object", properties: {} },
    },

    // ── ASSESSMENTS ───────────────────────────────────────────────────────
    {
      name: "get_assessments",
      description:
        "All assessments with submission counts and status. → /api/assessments",
      inputSchema: { type: "object", properties: {} },
    },

    // ── CHATBOT ENQUIRIES ─────────────────────────────────────────────────
    {
      name: "get_chatbot_enquiries",
      description:
        "All chatbot enquiries from users — useful for support and product insights. → /api/admin/chatbot-enquiries",
      inputSchema: { type: "object", properties: {} },
    },

    // ── COMBINED TOOLS ────────────────────────────────────────────────────
    {
      name: "get_full_dashboard_summary",
      description:
        "Complete dashboard snapshot in one call: stats + cohort stats + unread notifications + recent applications. Combines 4 endpoints in parallel.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_health_report",
      description:
        "Full platform health report: team statuses, at-risk teams (Red/Amber), sprint progress, and notifications. Combines /api/teams + /api/admin/cohort-stats + /api/admin/notifications.",
      inputSchema: { type: "object", properties: {} },
    },

  ],
}));

// ─────────────────────────────────────────────
// Tool Handlers
// ─────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  const ok = (data: unknown) => ({
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  });
  const err = (msg: string) => ({
    content: [{ type: "text" as const, text: `❌ Error: ${msg}` }],
    isError: true,
  });

  try {

    // ── LOGIN ─────────────────────────────────────────────────────────────
    if (name === "login") {
      const email    = (args.email as string)    || SV_EMAIL!;
      const password = (args.password as string) || SV_PASSWORD!;
      const success  = await performLogin(email, password);
      return ok({ status: success ? "Login successful" : "Login failed", authenticated: isLoggedIn });
    }

    // Guard
    if (!isLoggedIn) {
      return err("Not authenticated. The server auto-logins on startup. Try calling the 'login' tool if the session expired.");
    }

    // ── DASHBOARD STATS ───────────────────────────────────────────────────
    if (name === "get_dashboard_stats") {
      const data = await apiGet("/api/admin/stats");
      return ok({ dashboard_stats: data });
    }

    if (name === "get_cohort_stats") {
      const data = await apiGet("/api/admin/cohort-stats");
      return ok({ cohort_stats: data });
    }

    // ── NOTIFICATIONS ─────────────────────────────────────────────────────
    if (name === "get_notifications") {
      const data = await apiGet("/api/admin/notifications");
      return ok({ notifications: data });
    }

    if (name === "get_unread_notification_count") {
      const data = await apiGet("/api/admin/notifications/unread");
      return ok({ unread_notifications: data });
    }

    // ── APPLICATIONS ──────────────────────────────────────────────────────
    if (name === "get_recent_applications") {
      const data = await apiGet("/api/admin/recent-applications");
      return ok({ recent_applications: data });
    }

    if (name === "get_applications_by_type") {
      const type = args.type as string;
      const data = await apiGet(`/api/admin/applications?type=${type}`);
      return ok({ applications: data, type });
    }

    if (name === "get_all_applications") {
      const types = ["FOUNDER", "COFOUNDER", "LEARNER", "TEAM", "MENTOR"] as const;
      const results = await Promise.allSettled(
        types.map((t) => apiGet(`/api/admin/applications?type=${t}`))
      );
      const combined: Record<string, unknown> = {};
      results.forEach((result, i) => {
        combined[types[i]] =
          result.status === "fulfilled"
            ? result.value
            : { error: (result as PromiseRejectedResult).reason?.message };
      });
      return ok({ all_applications: combined });
    }

    if (name === "get_team_applications") {
      const data = await apiGet("/api/admin/team-applications");
      return ok({ team_applications: data });
    }

    // ── USERS ─────────────────────────────────────────────────────────────
    if (name === "get_users") {
      const data = await apiGet("/api/admin/users");
      return ok({ users: data });
    }

    // ── TEAMS ─────────────────────────────────────────────────────────────
    if (name === "get_teams") {
      const data = await apiGet("/api/teams");
      return ok({ teams: data });
    }

    if (name === "get_my_team") {
      const data = await apiGet("/api/my-team");
      return ok({ my_team: data });
    }

    // ── COHORTS ───────────────────────────────────────────────────────────
    if (name === "get_cohorts") {
      const data = await apiGet("/api/cohorts");
      return ok({ cohorts: data });
    }

    // ── PROBLEM STATEMENTS ────────────────────────────────────────────────
    if (name === "get_problem_statements") {
      const data = await apiGet("/api/problem-statements");
      return ok({ problem_statements: data });
    }

    if (name === "get_published_problem_statements") {
      const data = await apiGet("/api/problem-statements?status=PUBLISHED");
      return ok({ published_problem_statements: data });
    }

    // ── JOB POSTINGS ──────────────────────────────────────────────────────
    if (name === "get_job_postings") {
      const data = await apiGet("/api/admin/job-postings");
      return ok({ job_postings: data });
    }

    // ── ASSESSMENTS ───────────────────────────────────────────────────────
    if (name === "get_assessments") {
      const data = await apiGet("/api/assessments");
      return ok({ assessments: data });
    }

    // ── CHATBOT ENQUIRIES ─────────────────────────────────────────────────
    if (name === "get_chatbot_enquiries") {
      const data = await apiGet("/api/admin/chatbot-enquiries");
      return ok({ chatbot_enquiries: data });
    }

    // ── FULL DASHBOARD SUMMARY ────────────────────────────────────────────
    if (name === "get_full_dashboard_summary") {
      const [stats, cohortStats, unread, recentApps] = await Promise.allSettled([
        apiGet("/api/admin/stats"),
        apiGet("/api/admin/cohort-stats"),
        apiGet("/api/admin/notifications/unread"),
        apiGet("/api/admin/recent-applications"),
      ]);

      return ok({
        summary: {
          stats:         stats.status         === "fulfilled" ? stats.value         : { error: (stats         as PromiseRejectedResult).reason?.message },
          cohort_stats:  cohortStats.status   === "fulfilled" ? cohortStats.value   : { error: (cohortStats   as PromiseRejectedResult).reason?.message },
          unread_notifs: unread.status        === "fulfilled" ? unread.value        : { error: (unread        as PromiseRejectedResult).reason?.message },
          recent_apps:   recentApps.status    === "fulfilled" ? recentApps.value    : { error: (recentApps    as PromiseRejectedResult).reason?.message },
          generated_at:  new Date().toISOString(),
        },
      });
    }

    // ── HEALTH REPORT ─────────────────────────────────────────────────────
    if (name === "get_health_report") {
      const [teamsRes, cohortStatsRes, notifsRes] = await Promise.allSettled([
        apiGet("/api/teams"),
        apiGet("/api/admin/cohort-stats"),
        apiGet("/api/admin/notifications"),
      ]);

      const teamsData      = teamsRes.status      === "fulfilled" ? teamsRes.value      : null;
      const cohortData     = cohortStatsRes.status === "fulfilled" ? cohortStatsRes.value : null;
      const notifData      = notifsRes.status      === "fulfilled" ? notifsRes.value      : null;

      // Build team health summary
      let teamHealthSummary = null;
      let atRiskTeams: unknown[] = [];

      if (Array.isArray(teamsData)) {
        const health = { green: 0, amber: 0, red: 0, total: teamsData.length };
        teamsData.forEach((team: Record<string, unknown>) => {
          const status = ((team.healthStatus || team.health_status || "") as string).toLowerCase();
          if (status === "green") health.green++;
          else if (status === "amber") health.amber++;
          else if (status === "red") health.red++;
        });
        teamHealthSummary = health;
        atRiskTeams = teamsData.filter((team: Record<string, unknown>) => {
          const status = ((team.healthStatus || team.health_status || "") as string).toLowerCase();
          return status === "red" || status === "amber";
        });
      }

      return ok({
        health_report: {
          team_health_summary: teamHealthSummary,
          at_risk_teams:       atRiskTeams,
          all_teams:           teamsData,
          cohort_stats:        cohortData,
          notifications:       notifData,
          generated_at:        new Date().toISOString(),
        },
      });
    }

    return err(`Unknown tool: ${name}`);

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return err(msg);
  }
});

// ─────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────
await initBrowser();

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("✅ StartupVarsity Admin MCP Server v2.0 running");