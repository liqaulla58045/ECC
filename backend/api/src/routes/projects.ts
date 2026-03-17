import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { registerProjectWithMcp, fetchMcpStats } from '../services/mcpConnector.js';

const router = Router();
router.use(authenticate);

// GET /api/projects
router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
    const { rows } = await db.query(
        `SELECT id, name, category, mcp_url, status, description,
                live_url, git_repo, email, progress, start_date, end_date, created_at
         FROM projects
         ORDER BY created_at DESC`
    );
    res.json(rows);
});

// GET /api/projects/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    const { rows } = await db.query(
        `SELECT id, name, category, mcp_url, status, description,
                live_url, git_repo, email, progress, start_date, end_date, created_at
         FROM projects WHERE id = $1`,
        [req.params.id]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Project not found.' }); return; }
    res.json(rows[0]);
});

// GET /api/projects/:id/stats — latest metrics snapshot
router.get('/:id/stats', async (req: AuthRequest, res: Response): Promise<void> => {
    const { rows } = await db.query(
        `SELECT * FROM metrics_snapshots
         WHERE project_id = $1
         ORDER BY snapshotted_at DESC
         LIMIT 1`,
        [req.params.id]
    );
    res.json(rows[0] || null);
});

// GET /api/projects/:id/monthly-metrics
router.get('/:id/monthly-metrics', async (req: AuthRequest, res: Response): Promise<void> => {
    const { year } = req.query;
    const params: any[] = [req.params.id];
    let sql = `SELECT month, year, leads, revenue_lakhs, new_applications, new_teams
               FROM monthly_metrics WHERE project_id = $1`;
    if (year) { sql += ' AND year = $2'; params.push(Number(year)); }
    sql += ' ORDER BY year ASC, to_date(month, \'Mon\') ASC';

    const { rows } = await db.query(sql, params);
    res.json(rows);
});

// POST /api/projects — chairman/admin only
router.post('/', requireRole('chairman', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { id, name, category, mcpUrl, status, description, liveUrl, gitRepo, email, progress, startDate, endDate } = req.body;

    if (!id || !name) {
        res.status(400).json({ error: 'id and name are required.' });
        return;
    }

    const { rows } = await db.query(
        `INSERT INTO projects (id, name, category, mcp_url, status, description, live_url, git_repo, email, progress, start_date, end_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING id, name, category, mcp_url, status, description, live_url, git_repo, email, progress, start_date, end_date, created_at`,
        [id, name, category || 'Platform', mcpUrl || null, status || 'Active', description || null,
         liveUrl || null, gitRepo || null, email || null, progress ?? 0, startDate || null, endDate || null]
    );
    res.status(201).json(rows[0]);
});

// PATCH /api/projects/:id
router.patch('/:id', requireRole('chairman', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, category, mcpUrl, status, description, liveUrl, gitRepo, email, progress, startDate, endDate } = req.body;
    const { rows } = await db.query(
        `UPDATE projects SET
            name        = COALESCE($1,  name),
            category    = COALESCE($2,  category),
            mcp_url     = COALESCE($3,  mcp_url),
            status      = COALESCE($4,  status),
            description = COALESCE($5,  description),
            live_url    = COALESCE($6,  live_url),
            git_repo    = COALESCE($7,  git_repo),
            email       = COALESCE($8,  email),
            progress    = COALESCE($9,  progress),
            start_date  = COALESCE($10, start_date),
            end_date    = COALESCE($11, end_date),
            updated_at  = NOW()
         WHERE id = $12
         RETURNING id, name, category, mcp_url, status, description, progress, updated_at`,
        [name ?? null, category ?? null, mcpUrl ?? null, status ?? null, description ?? null,
         liveUrl ?? null, gitRepo ?? null, email ?? null, progress ?? null,
         startDate ?? null, endDate ?? null, req.params.id]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Project not found.' }); return; }
    res.json(rows[0]);
});

// DELETE /api/projects/:id — chairman only
router.delete('/:id', requireRole('chairman'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { rowCount } = await db.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    if (!rowCount) { res.status(404).json({ error: 'Project not found.' }); return; }
    res.json({ success: true });
});

// POST /api/projects/:id/snapshots — save a metrics snapshot (from MCP scrape)
router.post('/:id/snapshots', requireRole('chairman', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { totalUsers, totalLearners, totalTeams, totalMentors, totalApplications,
            activeCohorts, seedDeployedLakhs, stipendsDisbursedLakhs, placementRate, completionRate } = req.body;

    const { rows } = await db.query(
        `INSERT INTO metrics_snapshots
            (project_id, total_users, total_learners, total_teams, total_mentors,
             total_applications, active_cohorts, seed_deployed_lakhs, stipends_disbursed_lakhs,
             placement_rate, completion_rate)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [req.params.id, totalUsers ?? 0, totalLearners ?? 0, totalTeams ?? 0, totalMentors ?? 0,
         totalApplications ?? 0, activeCohorts ?? 0, seedDeployedLakhs ?? 0,
         stipendsDisbursedLakhs ?? 0, placementRate ?? null, completionRate ?? null]
    );
    res.status(201).json(rows[0]);
});

// POST /api/projects/:id/sync — register with MCP server and pull live stats
router.post('/:id/sync', requireRole('chairman', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const projectId = req.params.id;

    const { rows } = await db.query(
        'SELECT id, name, mcp_url, email FROM projects WHERE id = $1',
        [projectId]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Project not found.' }); return; }

    const project = rows[0];
    const mcpUrl = project.mcp_url;
    const loginEmail = email || project.email;

    if (!mcpUrl || !loginEmail || !password) {
        res.status(400).json({ error: 'mcp_url, email, and password are required to sync.' });
        return;
    }

    try {
        // 1. Register project with MCP — triggers Playwright login
        await registerProjectWithMcp(projectId, mcpUrl, loginEmail, password, project.name);

        // 2. Fetch live stats from platform via MCP proxy
        const raw = await fetchMcpStats(projectId);
        const s = raw as any;

        // 3. Save metrics snapshot
        const snap = await db.query(
            `INSERT INTO metrics_snapshots
                (project_id, total_users, total_learners, total_teams, total_mentors,
                 total_applications, active_cohorts, seed_deployed_lakhs, stipends_disbursed_lakhs)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             RETURNING *`,
            [
                projectId,
                s.totalUsers         ?? s.total_users         ?? 0,
                s.totalLearners      ?? s.total_learners      ?? 0,
                s.totalTeams         ?? s.total_teams         ?? 0,
                s.totalMentors       ?? s.total_mentors       ?? 0,
                s.totalApplications  ?? s.total_applications  ?? 0,
                s.activeCohorts      ?? s.active_cohorts      ?? 0,
                s.seedDeployedLakhs  ?? s.seed_deployed_lakhs  ?? 0,
                s.stipendsDisbursedLakhs ?? s.stipends_disbursed_lakhs ?? 0,
            ]
        );

        // 4. Mark project as Active
        await db.query(`UPDATE projects SET status = 'Active', updated_at = NOW() WHERE id = $1`, [projectId]);

        res.json({ success: true, snapshot: snap.rows[0] });
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Sync failed' });
    }
});

export default router;
