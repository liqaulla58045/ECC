import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { config } from 'dotenv';
import { runMigrations } from './db/index.js';
import { errorHandler } from './middleware/errorHandler.js';

// frontend build is copied into backend/api/dist/public during the Render build step
// so the path is always __dirname/public regardless of CWD
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const FRONTEND_DIST = path.join(__dirname, 'public');

import authRouter          from './routes/auth.js';
import usersRouter         from './routes/users.js';
import projectsRouter      from './routes/projects.js';
import cohortsRouter       from './routes/cohorts.js';
import teamsRouter         from './routes/teams.js';
import applicationsRouter  from './routes/applications.js';
import notificationsRouter from './routes/notifications.js';
import analyticsRouter     from './routes/analytics.js';
import miscRouter          from './routes/misc.js';
import aiRouter            from './routes/ai.js';

config();

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

app.use(cors({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS policy blocked: ${origin}`));
    },
    credentials: true,
}));

app.use(express.json());

// ─── Serve frontend in production ──────────────
if (process.env.NODE_ENV === 'production') {
    const distExists = fs.existsSync(FRONTEND_DIST);
    console.log(`📦 Frontend dist: ${FRONTEND_DIST} (exists: ${distExists})`);
    app.use(express.static(FRONTEND_DIST));
}

// ─── Health check ──────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ────────────────────────────────────
app.use('/api/auth',          authRouter);
app.use('/api/users',         usersRouter);
app.use('/api/projects',      projectsRouter);
app.use('/api/cohorts',       cohortsRouter);
app.use('/api/teams',         teamsRouter);
app.use('/api/applications',  applicationsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/analytics',     analyticsRouter);
app.use('/api',               miscRouter);   // problem-statements, job-postings, assessments, chatbot-enquiries
app.use('/',                  aiRouter);     // /claude, /openai

// ─── SPA fallback (must be after all API routes) ─
if (process.env.NODE_ENV === 'production') {
    app.get('*', (_req, res) => {
        res.sendFile(path.join(FRONTEND_DIST, 'index.html'), (err) => {
            if (err) res.status(500).json({ error: 'Frontend not built', dist: FRONTEND_DIST });
        });
    });
} else {
    app.use((_req, res) => {
        res.status(404).json({ error: 'Route not found.' });
    });
}

// ─── Error handler ─────────────────────────────
app.use(errorHandler);

// ─── Boot ──────────────────────────────────────
async function start() {
    try {
        await runMigrations();
        app.listen(PORT, () => {
            console.log(`✅ ECC API running on http://localhost:${PORT}`);
            console.log(`   Docs: GET /health`);
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

start();
