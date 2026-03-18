import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();
router.use(authenticate);

// GET /api/users  — list all users (admin/chairman only)
router.get('/', requireRole('chairman', 'admin'), async (_req: AuthRequest, res: Response): Promise<void> => {
    const { rows } = await db.query(
        `SELECT id, username, email, role, first_name, last_name, avatar, is_active, created_at
         FROM users
         ORDER BY created_at DESC`
    );
    res.json(rows);
});

// GET /api/users/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    const { rows } = await db.query(
        'SELECT id, username, email, role, first_name, last_name, avatar, is_active, created_at FROM users WHERE id = $1',
        [req.params.id]
    );
    if (!rows[0]) { res.status(404).json({ error: 'User not found.' }); return; }
    res.json(rows[0]);
});

// POST /api/users  — create user (admin/chairman)
router.post('/', requireRole('chairman', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { username, email, password, role, firstName, lastName, avatar } = req.body;

    if (!username || !email || !password) {
        res.status(400).json({ error: 'username, email, and password are required.' });
        return;
    }

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await db.query(
        `INSERT INTO users (username, email, password_hash, role, first_name, last_name, avatar)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, username, email, role, first_name, last_name, avatar, created_at`,
        [username, email, hash, role || 'learner', firstName || null, lastName || null, avatar || null]
    );
    res.status(201).json(rows[0]);
});

// PATCH /api/users/:id — update user details
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    // Users may only update themselves unless they are admin/chairman
    if (req.user!.id !== req.params.id && !['chairman', 'admin'].includes(req.user!.role)) {
        res.status(403).json({ error: 'Forbidden.' });
        return;
    }

    const { firstName, lastName, avatar, isActive } = req.body;
    const { rows } = await db.query(
        `UPDATE users
         SET first_name = COALESCE($1, first_name),
             last_name  = COALESCE($2, last_name),
             avatar     = COALESCE($3, avatar),
             is_active  = COALESCE($4, is_active),
             updated_at = NOW()
         WHERE id = $5
         RETURNING id, username, email, role, first_name, last_name, avatar, is_active, updated_at`,
        [firstName ?? null, lastName ?? null, avatar ?? null, isActive ?? null, req.params.id]
    );
    if (!rows[0]) { res.status(404).json({ error: 'User not found.' }); return; }
    res.json(rows[0]);
});

// DELETE /api/users/:id — soft-delete (chairman only)
router.delete('/:id', requireRole('chairman'), async (req: AuthRequest, res: Response): Promise<void> => {
    await db.query('UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ success: true });
});

export default router;
