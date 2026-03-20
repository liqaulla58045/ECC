import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { config } from 'dotenv';
import { runMigrations } from './db/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const FRONTEND_DIST_CANDIDATES = [
    path.join(__dirname, 'public'),
    path.resolve(__dirname, '..', '..', '..', 'frontend', 'dist'),
    path.resolve(process.cwd(), 'frontend', 'dist'),
];
const FRONTEND_DIST = FRONTEND_DIST_CANDIDATES.find((p) => fs.existsSync(p)) || FRONTEND_DIST_CANDIDATES[0];

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

const corsMiddleware = cors({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        const err: any = new Error(`CORS policy blocked: ${origin}`);
        err.status = 403;
        cb(err);
    },
    credentials: true,
});

// Apply CORS only to API-style routes. Static frontend assets should not go through CORS checks.
app.use(['/api', '/claude', '/openai'], corsMiddleware);

app.use(express.json());

// ─── Serve frontend in production ──────────────
if (process.env.NODE_ENV === 'production') {
    const distExists = fs.existsSync(FRONTEND_DIST);
    console.log(`📦 Frontend dist candidates: ${FRONTEND_DIST_CANDIDATES.join(' | ')}`);
    console.log(`📦 Using frontend dist: ${FRONTEND_DIST} (exists: ${distExists})`);
    if (distExists) {
        // Serve hashed Vite bundles with long caching. No fallthrough:false — if the
        // assets dir is missing or a file not found, fall through to SPA handler (404)
        // instead of propagating an ENOENT as a 500 JSON error that breaks asset loading.
        app.use('/assets', express.static(path.join(FRONTEND_DIST, 'assets'), {
            immutable: true,
            maxAge: '1y',
        }));
        app.use(express.static(FRONTEND_DIST));
    }
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
    const distExists = fs.existsSync(FRONTEND_DIST);
    // Only serve index.html for non-asset routes (let assets 404 cleanly)
    app.get('*', (req, res) => {
        if (/\.(js|css|ico|png|jpg|jpeg|svg|woff|woff2|ttf|map)$/.test(req.path)) {
            res.status(404).end();
            return;
        }
        if (!distExists) {
            res.status(503).json({ error: 'Frontend not available', tried: FRONTEND_DIST_CANDIDATES });
            return;
        }
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
