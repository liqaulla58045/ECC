import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();
router.use(authenticate);

// GET /api/cohorts?projectId=xxx
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.query;
    const params: any[] = [];
    let sql = `SELECT c.*, p.name AS project_name,
                      (SELECT COUNT(*) FROM teams t WHERE t.cohort_id = c.id) AS team_count
               FROM cohorts c
               JOIN projects p ON p.id = c.project_id`;
    if (projectId) { sql += ' WHERE c.project_id = $1'; params.push(projectId); }
    sql += ' ORDER BY c.created_at DESC';

    const { rows } = await db.query(sql, params);
    res.json(rows);
});

// GET /api/cohorts/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    const { rows } = await db.query(
        `SELECT c.*, p.name AS project_name,
                (SELECT COUNT(*) FROM teams t WHERE t.cohort_id = c.id) AS team_count
         FROM cohorts c
         JOIN projects p ON p.id = c.project_id
         WHERE c.id = $1`,
        [req.params.id]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Cohort not found.' }); return; }
    res.json(rows[0]);
});

// GET /api/cohorts/:id/teams
router.get('/:id/teams', async (req: AuthRequest, res: Response): Promise<void> => {
    const { rows } = await db.query(
        'SELECT * FROM teams WHERE cohort_id = $1 ORDER BY health_status ASC',
        [req.params.id]
    );
    res.json(rows);
});

// POST /api/cohorts
router.post('/', requireRole('chairman', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId, name, status, startDate, endDate, totalSprints, currentSprint } = req.body;
    if (!projectId || !name) {
        res.status(400).json({ error: 'projectId and name are required.' });
        return;
    }
    const { rows } = await db.query(
        `INSERT INTO cohorts (project_id, name, status, start_date, end_date, total_sprints, current_sprint)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [projectId, name, status || 'Active', startDate || null, endDate || null,
         totalSprints ?? 12, currentSprint ?? 1]
    );
    res.status(201).json(rows[0]);
});

// PATCH /api/cohorts/:id
router.patch('/:id', requireRole('chairman', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, status, startDate, endDate, totalSprints, currentSprint } = req.body;
    const { rows } = await db.query(
        `UPDATE cohorts SET
            name           = COALESCE($1, name),
            status         = COALESCE($2, status),
            start_date     = COALESCE($3, start_date),
            end_date       = COALESCE($4, end_date),
            total_sprints  = COALESCE($5, total_sprints),
            current_sprint = COALESCE($6, current_sprint),
            updated_at     = NOW()
         WHERE id = $7 RETURNING *`,
        [name ?? null, status ?? null, startDate ?? null, endDate ?? null,
         totalSprints ?? null, currentSprint ?? null, req.params.id]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Cohort not found.' }); return; }
    res.json(rows[0]);
});

// DELETE /api/cohorts/:id
router.delete('/:id', requireRole('chairman'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { rowCount } = await db.query('DELETE FROM cohorts WHERE id = $1', [req.params.id]);
    if (!rowCount) { res.status(404).json({ error: 'Cohort not found.' }); return; }
    res.json({ success: true });
});

export default router;
