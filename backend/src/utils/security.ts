import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const hashPassword = (password: string, salt: string) => crypto.scryptSync(password, salt, 64).toString('hex');
export const safeEqual = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
// Short-lived access token; the admin UI renews it with a rotating refresh token (see routes/admin.ts).
export const ACCESS_TOKEN_SECONDS = 15 * 60;
export const REFRESH_TOKEN_DAYS = 7;
export const REFRESH_FAMILY_MAX_DAYS = 30;
export const signAdmin = (email: string) => jwt.sign({ email, role: 'admin' }, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_SECONDS });
export const newRefreshToken = () => crypto.randomBytes(48).toString('base64url');
export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
export const orderCode = () => `HML-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
