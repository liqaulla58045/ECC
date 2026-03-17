import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, AuthUser } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid Authorization header.' });
        return;
    }

    const token = header.slice(7);

    try {
        const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
        req.user = payload;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

export function requireRole(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated.' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}.` });
            return;
        }
        next();
    };
}

export function signToken(user: AuthUser): string {
    return jwt.sign(user, JWT_SECRET, {
        expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
    });
}
