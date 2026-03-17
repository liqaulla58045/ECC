import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { runMigrations } from './db/index.js';
import { errorHandler } from './middleware/errorHandler.js';

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

// ─── 404 ───────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found.' });
});

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
