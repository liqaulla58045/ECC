// Problem Statements, Job Postings, Assessments, Chatbot Enquiries
import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();
router.use(authenticate);

// ─── PROBLEM STATEMENTS ───────────────────────

router.get('/problem-statements', async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId, status } = req.query;
    const params: any[] = [];
    const conds: string[] = [];
    if (projectId) { conds.push(`project_id = $${params.length + 1}`); params.push(projectId); }
    if (status)    { conds.push(`status = $${params.length + 1}`);      params.push(status); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(
        `SELECT * FROM problem_statements ${where} ORDER BY created_at DESC`, params
    );
    res.json(rows);
});

router.post('/problem-statements', requireRole('chairman', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId, title, description, status } = req.body;
    if (!projectId || !title) { res.status(400).json({ error: 'projectId and title required.' }); return; }
    const { rows } = await db.query(
        `INSERT INTO problem_statements (project_id, title, description, status) VALUES ($1,$2,$3,$4) RETURNING *`,
        [projectId, title, description || null, status || 'Draft']
    );
    res.status(201).json(rows[0]);
});

router.patch('/problem-statements/:id', requireRole('chairman', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, description, status } = req.body;
    const { rows } = await db.query(
        `UPDATE problem_statements SET
            title       = COALESCE($1, title),
            description = COALESCE($2, description),
            status      = COALESCE($3, status),
            updated_at  = NOW()
         WHERE id = $4 RETURNING *`,
        [title ?? null, description ?? null, status ?? null, req.params.id]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Not found.' }); return; }
    res.json(rows[0]);
});

// ─── JOB POSTINGS ─────────────────────────────

router.get('/job-postings', async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId, status } = req.query;
    const params: any[] = [];
    const conds: string[] = [];
    if (projectId) { conds.push(`project_id = $${params.length + 1}`); params.push(projectId); }
    if (status)    { conds.push(`status = $${params.length + 1}`);      params.push(status); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(`SELECT * FROM job_postings ${where} ORDER BY posted_at DESC`, params);
    res.json(rows);
});

router.post('/job-postings', requireRole('chairman', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId, title, company, location, type, status } = req.body;
    if (!projectId || !title) { res.status(400).json({ error: 'projectId and title required.' }); return; }
    const { rows } = await db.query(
        `INSERT INTO job_postings (project_id, title, company, location, type, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [projectId, title, company || null, location || null, type || null, status || 'Active']
    );
    res.status(201).json(rows[0]);
});

// ─── ASSESSMENTS ──────────────────────────────

router.get('/assessments', async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.query;
    const params: any[] = [];
    let sql = 'SELECT * FROM assessments';
    if (projectId) { sql += ' WHERE project_id = $1'; params.push(projectId); }
    sql += ' ORDER BY created_at DESC';
    const { rows } = await db.query(sql, params);
    res.json(rows);
});

router.post('/assessments', requireRole('chairman', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId, title, type, status } = req.body;
    if (!projectId || !title) { res.status(400).json({ error: 'projectId and title required.' }); return; }
    const { rows } = await db.query(
        `INSERT INTO assessments (project_id, title, type, status) VALUES ($1,$2,$3,$4) RETURNING *`,
        [projectId, title, type || null, status || 'Active']
    );
    res.status(201).json(rows[0]);
});

// ─── CHATBOT ENQUIRIES ────────────────────────

router.get('/chatbot-enquiries', requireRole('chairman', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId } = req.query;
    const params: any[] = [];
    let sql = 'SELECT * FROM chatbot_enquiries';
    if (projectId) { sql += ' WHERE project_id = $1'; params.push(projectId); }
    sql += ' ORDER BY created_at DESC';
    const { rows } = await db.query(sql, params);
    res.json(rows);
});

router.post('/chatbot-enquiries', async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId, userEmail, message, response } = req.body;
    if (!message) { res.status(400).json({ error: 'message is required.' }); return; }
    const { rows } = await db.query(
        `INSERT INTO chatbot_enquiries (project_id, user_email, message, response) VALUES ($1,$2,$3,$4) RETURNING *`,
        [projectId || null, userEmail || null, message, response || null]
    );
    res.status(201).json(rows[0]);
});

export default router;
