import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { signToken, authenticate } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400).json({ error: 'username and password are required.' });
        return;
    }

    const { rows } = await db.query(
        'SELECT id, username, email, password_hash, role, first_name, last_name, avatar FROM users WHERE username = $1 AND is_active = TRUE',
        [username]
    );

    const user = rows[0];
    if (!user) {
        res.status(401).json({ error: 'Invalid credentials.' });
        return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
        res.status(401).json({ error: 'Invalid credentials.' });
        return;
    }

    const token = signToken({
        id:       user.id,
        username: user.username,
        email:    user.email,
        role:     user.role,
    });

    res.json({
        token,
        user: {
            id:        user.id,
            username:  user.username,
            email:     user.email,
            role:      user.role,
            firstName: user.first_name,
            lastName:  user.last_name,
            avatar:    user.avatar,
        },
    });
});

// GET /api/auth/me  — returns the currently logged-in user
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    const { rows } = await db.query(
        'SELECT id, username, email, role, first_name, last_name, avatar, created_at FROM users WHERE id = $1',
        [req.user!.id]
    );
    if (!rows[0]) {
        res.status(404).json({ error: 'User not found.' });
        return;
    }
    const u = rows[0];
    res.json({
        id:        u.id,
        username:  u.username,
        email:     u.email,
        role:      u.role,
        firstName: u.first_name,
        lastName:  u.last_name,
        avatar:    u.avatar,
        createdAt: u.created_at,
    });
});

export default router;
