import { Request } from 'express';

export interface AuthUser {
    id: string;
    username: string;
    email: string;
    role: string;
}

export interface AuthRequest extends Request {
    user?: AuthUser;
}

export type AppRole = 'chairman' | 'admin' | 'learner' | 'mentor' | 'founder' | 'cofounder';
