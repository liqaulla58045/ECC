-- ═══════════════════════════════════════════════════════════════
-- Enterprise Command Center — PostgreSQL Schema
-- Run: psql -U postgres -d ecc_db -f schema.sql
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- USERS
-- Chairman, admins, learners, mentors, founders
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(100) UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(50)  NOT NULL DEFAULT 'learner',
    -- roles: chairman, admin, learner, mentor, founder, cofounder
    first_name    VARCHAR(100),
    last_name     VARCHAR(100),
    avatar        VARCHAR(10),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PROJECTS (Connected Platforms)
-- Each row = one external platform (e.g. StartupVarsity)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
    id                VARCHAR(100) PRIMARY KEY,
    name              VARCHAR(255) NOT NULL,
    category          VARCHAR(100) NOT NULL DEFAULT 'Platform',
    mcp_url           VARCHAR(500),
    status            VARCHAR(50)  NOT NULL DEFAULT 'Active',
    -- status: Active, Beta, Planning, Deprecated, Error
    description       TEXT,
    live_url          VARCHAR(500),
    git_repo          VARCHAR(500),
    email             VARCHAR(255),
    password_encrypted TEXT,
    stats_path        VARCHAR(500) NOT NULL DEFAULT '/api/admin/stats',
    progress          SMALLINT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    start_date        VARCHAR(50),
    end_date          VARCHAR(50),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- COHORTS
-- Incubation/learning cohorts per project
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cohorts (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id     VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name           VARCHAR(255) NOT NULL,
    status         VARCHAR(50)  NOT NULL DEFAULT 'Active',
    -- status: Active, Planning, Completed, Archived
    start_date     DATE,
    end_date       DATE,
    total_sprints  SMALLINT NOT NULL DEFAULT 12,
    current_sprint SMALLINT NOT NULL DEFAULT 1,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TEAMS
-- Startup teams enrolled in cohorts
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id       VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    cohort_id        UUID REFERENCES cohorts(id) ON DELETE SET NULL,
    name             VARCHAR(255) NOT NULL,
    health_status    VARCHAR(20)  NOT NULL DEFAULT 'Green',
    -- health_status: Green, Amber, Red
    sprint_progress  SMALLINT NOT NULL DEFAULT 0 CHECK (sprint_progress BETWEEN 0 AND 100),
    member_count     SMALLINT NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- APPLICATIONS
-- Founder / co-founder / learner / team / mentor applications
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type            VARCHAR(50)  NOT NULL,
    -- type: FOUNDER, COFOUNDER, LEARNER, TEAM, MENTOR
    applicant_name  VARCHAR(255),
    applicant_email VARCHAR(255),
    status          VARCHAR(50)  NOT NULL DEFAULT 'Pending',
    -- status: Pending, Approved, Rejected, Under Review
    applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- NOTIFICATIONS
-- Admin notifications per project
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title      VARCHAR(255) NOT NULL,
    message    TEXT,
    type       VARCHAR(50)  NOT NULL DEFAULT 'info',
    -- type: info, warning, error, success
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- METRICS SNAPSHOTS
-- Point-in-time KPI cache per project (from MCP/Playwright scrapes)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS metrics_snapshots (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id               VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    total_users              INT NOT NULL DEFAULT 0,
    total_learners           INT NOT NULL DEFAULT 0,
    total_teams              INT NOT NULL DEFAULT 0,
    total_mentors            INT NOT NULL DEFAULT 0,
    total_applications       INT NOT NULL DEFAULT 0,
    active_cohorts           INT NOT NULL DEFAULT 0,
    seed_deployed_lakhs      DECIMAL(12,2) NOT NULL DEFAULT 0,
    stipends_disbursed_lakhs DECIMAL(12,2) NOT NULL DEFAULT 0,
    placement_rate           DECIMAL(5,2),
    completion_rate          DECIMAL(5,2),
    snapshotted_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- MONTHLY METRICS
-- Time-series data used for charts (leads, revenue, etc.)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS monthly_metrics (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id       VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    month            VARCHAR(3)   NOT NULL,  -- 'Jan', 'Feb', ...
    year             SMALLINT     NOT NULL,
    leads            INT NOT NULL DEFAULT 0,
    revenue_lakhs    DECIMAL(12,2) NOT NULL DEFAULT 0,
    new_applications INT NOT NULL DEFAULT 0,
    new_teams        INT NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, month, year)
);

-- ─────────────────────────────────────────────
-- PROBLEM STATEMENTS
-- Challenge statements for startup cohorts
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS problem_statements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title       VARCHAR(500) NOT NULL,
    description TEXT,
    status      VARCHAR(50)  NOT NULL DEFAULT 'Draft',
    -- status: Draft, Published, Closed
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- JOB POSTINGS
-- Jobs listed on connected platforms
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_postings (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title      VARCHAR(255) NOT NULL,
    company    VARCHAR(255),
    location   VARCHAR(255),
    type       VARCHAR(50),
    -- type: Full-time, Part-time, Contract, Internship
    status     VARCHAR(50)  NOT NULL DEFAULT 'Active',
    posted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ASSESSMENTS
-- Skill assessments and tests
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessments (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id       VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title            VARCHAR(255) NOT NULL,
    type             VARCHAR(100),
    status           VARCHAR(50)  NOT NULL DEFAULT 'Active',
    submission_count INT NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- CHATBOT ENQUIRIES
-- AI chatbot conversation logs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chatbot_enquiries (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR(100) REFERENCES projects(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    message    TEXT NOT NULL,
    response   TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- MIGRATIONS (safe for existing databases)
-- ─────────────────────────────────────────────
ALTER TABLE projects ADD COLUMN IF NOT EXISTS stats_path VARCHAR(500) NOT NULL DEFAULT '/api/admin/stats';
ALTER TABLE metrics_snapshots ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- ─────────────────────────────────────────────
-- INDEXES (for common query patterns)
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_teams_project_id          ON teams(project_id);
CREATE INDEX IF NOT EXISTS idx_teams_cohort_id           ON teams(cohort_id);
CREATE INDEX IF NOT EXISTS idx_teams_health_status       ON teams(health_status);
CREATE INDEX IF NOT EXISTS idx_cohorts_project_id        ON cohorts(project_id);
CREATE INDEX IF NOT EXISTS idx_applications_project_id   ON applications(project_id);
CREATE INDEX IF NOT EXISTS idx_applications_type         ON applications(type);
CREATE INDEX IF NOT EXISTS idx_applications_status       ON applications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_project_id  ON notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read     ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_proj    ON metrics_snapshots(project_id, snapshotted_at DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_metrics_proj_year ON monthly_metrics(project_id, year, month);

-- ─────────────────────────────────────────────
-- DEFAULT CHAIRMAN USER
-- password: chairman@123 (bcrypt hash)
-- ─────────────────────────────────────────────
-- Default chairman user (password: chairman@123)
-- Hash generated via: bcrypt.hash('chairman@123', 12)
INSERT INTO users (username, email, password_hash, role, first_name, last_name, avatar)
VALUES (
    'chairman',
    'chairman@ecc.com',
    '$2a$12$Wp3qAmqgJgutYiQSwYPSbukA1z4ScOivv/7U30JHvYCbulmivpm/K',
    'chairman',
    'Rajesh',
    'Kumar',
    'RK'
) ON CONFLICT (username) DO NOTHING;
