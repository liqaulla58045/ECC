import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();
router.use(authenticate);

// GET /api/applications?projectId=xxx&type=FOUNDER&status=Pending
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId, type, status } = req.query;
    const params: any[] = [];
    const conditions: string[] = [];

    if (projectId) { conditions.push(`project_id = $${params.length + 1}`); params.push(projectId); }
    if (type)      { conditions.push(`type = $${params.length + 1}`);        params.push(type); }
    if (status)    { conditions.push(`status = $${params.length + 1}`);      params.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await db.query(
        `SELECT * FROM applications ${where} ORDER BY applied_at DESC`,
        params
    );
    res.json(rows);
});

// GET /api/applications/recent?projectId=xxx&limit=20
router.get('/recent', async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId, limit = '20' } = req.query;
    const params: any[] = [Number(limit)];
    let sql = 'SELECT * FROM applications';
    if (projectId) { sql += ' WHERE project_id = $2'; params.push(projectId); }
    sql += ' ORDER BY applied_at DESC LIMIT $1';

    const { rows } = await db.query(sql, params);
    res.json(rows);
});

// GET /api/applications/summary?projectId=xxx  — counts by type
router.get('/summary', async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.query;
    const params: any[] = [];
    let sql = 'SELECT type, status, COUNT(*) AS count FROM applications';
    if (projectId) { sql += ' WHERE project_id = $1'; params.push(projectId); }
    sql += ' GROUP BY type, status ORDER BY type, status';

    const { rows } = await db.query(sql, params);
    res.json(rows);
});

// GET /api/applications/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    const { rows } = await db.query('SELECT * FROM applications WHERE id = $1', [req.params.id]);
    if (!rows[0]) { res.status(404).json({ error: 'Application not found.' }); return; }
    res.json(rows[0]);
});

// POST /api/applications
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId, type, applicantName, applicantEmail } = req.body;
    if (!projectId || !type) {
        res.status(400).json({ error: 'projectId and type are required.' });
        return;
    }
    const validTypes = ['FOUNDER', 'COFOUNDER', 'LEARNER', 'TEAM', 'MENTOR'];
    if (!validTypes.includes(type)) {
        res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
        return;
    }
    const { rows } = await db.query(
        `INSERT INTO applications (project_id, type, applicant_name, applicant_email)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [projectId, type, applicantName || null, applicantEmail || null]
    );
    res.status(201).json(rows[0]);
});

// PATCH /api/applications/:id/status  — approve / reject / review
router.patch('/:id/status', requireRole('chairman', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Approved', 'Rejected', 'Under Review'];
    if (!validStatuses.includes(status)) {
        res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
        return;
    }
    const { rows } = await db.query(
        'UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, req.params.id]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Application not found.' }); return; }
    res.json(rows[0]);
});

// DELETE /api/applications/:id
router.delete('/:id', requireRole('chairman', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { rowCount } = await db.query('DELETE FROM applications WHERE id = $1', [req.params.id]);
    if (!rowCount) { res.status(404).json({ error: 'Application not found.' }); return; }
    res.json({ success: true });
});

export default router;
