import { Router, type Response } from 'express';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';
import { RefreshToken } from '../models/refresh-token.model.js';
import { env } from '../config/env.js';
import { ACCESS_TOKEN_SECONDS, REFRESH_FAMILY_MAX_DAYS, REFRESH_TOKEN_DAYS, hashPassword, hashToken, newRefreshToken, safeEqual, signAdmin } from '../utils/security.js';
import { requireAdmin } from '../middleware/auth.js';

export const adminRouter = Router();
adminRouter.post('/login', rateLimit({ windowMs: 15 * 60_000, limit: 10 }), (req, res) => {
  const { email, password } = req.body || {};
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD_HASH || !env.ADMIN_PASSWORD_SALT) return res.status(503).json({ message: 'Admin auth chưa được cấu hình đầy đủ.' });
  const validEmail = String(email || '').toLowerCase() === env.ADMIN_EMAIL.toLowerCase();
  const validPassword = typeof password === 'string' && safeEqual(hashPassword(password, env.ADMIN_PASSWORD_SALT), env.ADMIN_PASSWORD_HASH);
  if (!validEmail || !validPassword) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
  return issueSession(res, env.ADMIN_EMAIL);
});

const DAY = 86_400_000;
const REUSE_GRACE_MS = 15_000;
const dbReady = () => mongoose.connection.readyState === 1;

// Without MongoDB there is nowhere to keep refresh tokens, so the session simply has no refresh token.
async function issueSession(res: Response, email: string, family: string = crypto.randomUUID(), familyStartedAt: Date = new Date()) {
  const data: Record<string, unknown> = { token: signAdmin(email), email, expiresIn: ACCESS_TOKEN_SECONDS };
  if (dbReady()) {
    const refreshToken = newRefreshToken();
    const expiresAt = new Date(Math.min(Date.now() + REFRESH_TOKEN_DAYS * DAY, familyStartedAt.getTime() + REFRESH_FAMILY_MAX_DAYS * DAY));
    await RefreshToken.create({ tokenHash: hashToken(refreshToken), family, email, familyStartedAt, expiresAt });
    data.refreshToken = refreshToken;
  }
  return res.json({ data });
}

// Rotating refresh: each token works once. Presenting an already-used token again (outside a short grace for parallel tabs) revokes the whole family.
adminRouter.post('/refresh', rateLimit({ windowMs: 60_000, limit: 30 }), async (req, res) => {
  const presented = req.body?.refreshToken;
  if (typeof presented !== 'string' || presented.length < 20 || presented.length > 200) return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ.', code: 'REFRESH_INVALID' });
  if (!dbReady()) return res.status(503).json({ message: 'Máy chủ chưa sẵn sàng, thử lại sau nhé.' });
  const record = await RefreshToken.findOne({ tokenHash: hashToken(presented) });
  if (!record || record.expiresAt.getTime() <= Date.now()) return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn.', code: 'REFRESH_EXPIRED' });
  if (record.usedAt) {
    if (Date.now() - record.usedAt.getTime() > REUSE_GRACE_MS) await RefreshToken.deleteMany({ family: record.family });
    return res.status(401).json({ message: 'Phiên đăng nhập đã được làm mới ở nơi khác.', code: 'REFRESH_REUSED' });
  }
  const claimed = await RefreshToken.updateOne({ _id: record._id, usedAt: { $exists: false } }, { usedAt: new Date() });
  if (!claimed.modifiedCount) return res.status(401).json({ message: 'Phiên đăng nhập đã được làm mới ở nơi khác.', code: 'REFRESH_REUSED' });
  return issueSession(res, record.email, record.family, record.familyStartedAt);
});

adminRouter.post('/logout', async (req, res) => {
  const presented = req.body?.refreshToken;
  if (typeof presented === 'string' && presented.length <= 200 && dbReady()) {
    const record = await RefreshToken.findOne({ tokenHash: hashToken(presented) });
    if (record) await RefreshToken.deleteMany({ family: record.family });
  }
  return res.json({ data: { ok: true } });
});

adminRouter.use(requireAdmin);
adminRouter.get('/dashboard', async (_req, res) => {
  const [totalOrders, pendingOrders, processingOrders, completedOrders, cancelledOrders, revenue, unpaidValue] = await Promise.all([
    Order.countDocuments(), Order.countDocuments({ status: 'pending' }), Order.countDocuments({ status: { $in: ['confirmed', 'processing'] } }), Order.countDocuments({ status: 'completed' }), Order.countDocuments({ status: 'cancelled' }),
    Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, value: { $sum: '$total' } } }]), Order.aggregate([{ $match: { paymentStatus: 'unpaid' } }, { $group: { _id: null, value: { $sum: '$total' } } }]),
  ]);
  return res.json({ data: { totalOrders, pendingOrders, processingOrders, completedOrders, cancelledOrders, revenue: revenue[0]?.value || 0, unpaidValue: unpaidValue[0]?.value || 0 } });
});

adminRouter.get('/orders', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10)); const search = String(req.query.search || '').trim();
  const query: any = {}; const status = String(req.query.status || ''); const paymentStatus = String(req.query.paymentStatus || '');
  if (['pending', 'confirmed', 'processing', 'completed', 'cancelled'].includes(status)) query.status = status;
  if (['unpaid', 'paid', 'failed', 'refunded'].includes(paymentStatus)) query.paymentStatus = paymentStatus;
  if (search) { const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); query.$or = [{ orderCode: new RegExp(safe, 'i') }, { 'customer.fullName': new RegExp(safe, 'i') }, { 'customer.phone': new RegExp(safe, 'i') }]; }
  const [data, total] = await Promise.all([Order.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Order.countDocuments(query)]);
  return res.json({ data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});

adminRouter.get('/orders/:id', async (req, res) => { const order = await Order.findById(req.params.id).lean(); if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' }); return res.json({ data: order }); });

const statusOrder: Record<string, string[]> = { pending: ['confirmed', 'processing', 'cancelled'], confirmed: ['processing', 'cancelled'], processing: ['completed', 'cancelled'], completed: [], cancelled: [] };
adminRouter.patch('/orders/:id/status', async (req, res) => {
  const parsed = z.object({ status: z.enum(['pending', 'confirmed', 'processing', 'completed', 'cancelled']) }).safeParse(req.body); if (!parsed.success) return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
  const order = await Order.findById(req.params.id); if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
  if (parsed.data.status !== order.status && !statusOrder[order.status].includes(parsed.data.status)) return res.status(409).json({ message: `Không thể chuyển từ ${order.status} sang ${parsed.data.status}.` });
  order.status = parsed.data.status; await order.save(); return res.json({ data: order });
});

adminRouter.patch('/orders/:id/payment', async (req, res) => {
  const parsed = z.object({ paymentStatus: z.enum(['unpaid', 'paid', 'failed', 'refunded']) }).safeParse(req.body); if (!parsed.success) return res.status(400).json({ message: 'Trạng thái thanh toán không hợp lệ.' });
  const order = await Order.findByIdAndUpdate(req.params.id, { paymentStatus: parsed.data.paymentStatus }, { new: true }).lean(); if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' }); return res.json({ data: order });
});

adminRouter.get('/customers', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10)); const search = String(req.query.search || '').trim();
  const match: any = {}; if (search) { const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); match.$or = [{ 'customer.fullName': new RegExp(safe, 'i') }, { 'customer.phone': new RegExp(safe, 'i') }, { 'customer.email': new RegExp(safe, 'i') }]; }
  const grouped = await Order.aggregate([{ $match: match }, { $sort: { createdAt: -1 } }, { $group: { _id: '$customer.phone', customer: { $first: '$customer' }, lastOrderAt: { $max: '$createdAt' } } }, { $sort: { lastOrderAt: -1 } }, { $project: { customer: { fullName: 1, phone: 1, email: 1, birthYear: 1, gender: 1, province: 1, district: 1 } } }, { $facet: { data: [{ $skip: (page - 1) * limit }, { $limit: limit }], meta: [{ $count: 'total' }] } }]);
  const result = grouped[0] || { data: [], meta: [] }; const total = result.meta[0]?.total || 0; return res.json({ data: result.data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});
