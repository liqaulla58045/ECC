import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();
router.use(authenticate);

// GET /api/notifications?projectId=xxx&unreadOnly=true
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId, unreadOnly } = req.query;
    const params: any[] = [];
    const conditions: string[] = [];

    if (projectId)  { conditions.push(`project_id = $${params.length + 1}`); params.push(projectId); }
    if (unreadOnly === 'true') { conditions.push('is_read = FALSE'); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await db.query(
        `SELECT * FROM notifications ${where} ORDER BY created_at DESC`,
        params
    );
    res.json(rows);
});

// GET /api/notifications/unread-count?projectId=xxx
router.get('/unread-count', async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.query;
    const params: any[] = [];
    let sql = 'SELECT COUNT(*) AS count FROM notifications WHERE is_read = FALSE';
    if (projectId) { sql += ' AND project_id = $1'; params.push(projectId); }

    const { rows } = await db.query(sql, params);
    res.json({ count: Number(rows[0].count) });
});

// POST /api/notifications
router.post('/', requireRole('chairman', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId, title, message, type } = req.body;
    if (!projectId || !title) {
        res.status(400).json({ error: 'projectId and title are required.' });
        return;
    }
    const { rows } = await db.query(
        'INSERT INTO notifications (project_id, title, message, type) VALUES ($1,$2,$3,$4) RETURNING *',
        [projectId, title, message || null, type || 'info']
    );
    res.status(201).json(rows[0]);
});

// PATCH /api/notifications/:id/read  — mark as read
router.patch('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
    const { rows } = await db.query(
        'UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *',
        [req.params.id]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Notification not found.' }); return; }
    res.json(rows[0]);
});

// PATCH /api/notifications/mark-all-read?projectId=xxx
router.patch('/mark-all-read', requireRole('chairman', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.query;
    const params: any[] = [];
    let sql = 'UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE';
    if (projectId) { sql += ' AND project_id = $1'; params.push(projectId); }
    sql += ' RETURNING id';

    const { rows } = await db.query(sql, params);
    res.json({ updated: rows.length });
});

// DELETE /api/notifications/:id
router.delete('/:id', requireRole('chairman', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
    await db.query('DELETE FROM notifications WHERE id = $1', [req.params.id]);
    res.json({ success: true });
});

export default router;
