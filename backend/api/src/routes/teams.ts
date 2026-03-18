import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();
router.use(authenticate);

// GET /api/teams?projectId=xxx&cohortId=yyy&health=Red
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId, cohortId, health } = req.query;
    const params: any[] = [];
    const conditions: string[] = [];

    if (projectId) { conditions.push(`t.project_id = $${params.length + 1}`); params.push(projectId); }
    if (cohortId)  { conditions.push(`t.cohort_id = $${params.length + 1}`);  params.push(cohortId); }
    if (health)    { conditions.push(`t.health_status = $${params.length + 1}`); params.push(health); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await db.query(
        `SELECT t.*, c.name AS cohort_name, p.name AS project_name
         FROM teams t
         LEFT JOIN cohorts c  ON c.id = t.cohort_id
         LEFT JOIN projects p ON p.id = t.project_id
         ${where}
         ORDER BY t.health_status ASC, t.name ASC`,
        params
    );
    res.json(rows);
});

// GET /api/teams/health-summary?projectId=xxx
router.get('/health-summary', async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.query;
    const params: any[] = [];
    let sql = `SELECT health_status, COUNT(*) AS count FROM teams`;
    if (projectId) { sql += ' WHERE project_id = $1'; params.push(projectId); }
    sql += ' GROUP BY health_status';

    const { rows } = await db.query(sql, params);
    const summary: Record<string, number> = { Green: 0, Amber: 0, Red: 0 };
    rows.forEach((r: any) => { summary[r.health_status] = Number(r.count); });
    res.json(summary);
});

// GET /api/teams/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    const { rows } = await db.query(
        `SELECT t.*, c.name AS cohort_name, p.name AS project_name
         FROM teams t
         LEFT JOIN cohorts c  ON c.id = t.cohort_id
         LEFT JOIN projects p ON p.id = t.project_id
         WHERE t.id = $1`,
        [req.params.id]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Team not found.' }); return; }
    res.json(rows[0]);
});

// POST /api/teams
router.post('/', requireRole('chairman', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId, cohortId, name, healthStatus, sprintProgress, memberCount } = req.body;
    if (!projectId || !name) {
        res.status(400).json({ error: 'projectId and name are required.' });
        return;
    }
    const { rows } = await db.query(
        `INSERT INTO teams (project_id, cohort_id, name, health_status, sprint_progress, member_count)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [projectId, cohortId || null, name, healthStatus || 'Green', sprintProgress ?? 0, memberCount ?? 0]
    );
    res.status(201).json(rows[0]);
});

// PATCH /api/teams/:id
router.patch('/:id', requireRole('chairman', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, healthStatus, sprintProgress, memberCount, cohortId } = req.body;
    const { rows } = await db.query(
        `UPDATE teams SET
            name            = COALESCE($1, name),
            health_status   = COALESCE($2, health_status),
            sprint_progress = COALESCE($3, sprint_progress),
            member_count    = COALESCE($4, member_count),
            cohort_id       = COALESCE($5, cohort_id),
            updated_at      = NOW()
         WHERE id = $6 RETURNING *`,
        [name ?? null, healthStatus ?? null, sprintProgress ?? null, memberCount ?? null,
         cohortId ?? null, req.params.id]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Team not found.' }); return; }
    res.json(rows[0]);
});

// DELETE /api/teams/:id
router.delete('/:id', requireRole('chairman', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { rowCount } = await db.query('DELETE FROM teams WHERE id = $1', [req.params.id]);
    if (!rowCount) { res.status(404).json({ error: 'Team not found.' }); return; }
    res.json({ success: true });
});

export default router;
