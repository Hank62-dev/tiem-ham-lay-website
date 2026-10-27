import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Vui lòng đăng nhập quản trị.' });
  try { res.locals.admin = jwt.verify(token, env.JWT_SECRET); return next(); } catch { return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn.' }); }
}
