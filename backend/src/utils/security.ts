import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const hashPassword = (password: string, salt: string) => crypto.scryptSync(password, salt, 64).toString('hex');
export const safeEqual = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
export const signAdmin = (email: string) => jwt.sign({ email, role: 'admin' }, env.JWT_SECRET, { expiresIn: '8h' });
export const orderCode = () => `HML-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
