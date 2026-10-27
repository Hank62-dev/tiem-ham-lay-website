import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { products } from '../config/products.js';
import { Order } from '../models/order.model.js';
import { env } from '../config/env.js';
import { orderCode } from '../utils/security.js';
import { sendNewOrderEmail } from '../services/email.js';

export const publicRouter = Router();
publicRouter.get('/products', (_req, res) => res.json({ data: products }));

const itemInput = z.object({ productId: z.string().min(1).max(60), quantity: z.number().int().min(1).max(20) });
const orderInput = z.object({
  items: z.array(itemInput).min(1).max(20), customer: z.object({ fullName: z.string().trim().min(2).max(100), phone: z.string().regex(/^(0|\+84)[0-9 .-]{8,14}$/), email: z.string().email().optional().or(z.literal('')), birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(), gender: z.enum(['female', 'male', 'other', 'prefer-not-to-say']).optional(), address: z.string().trim().min(5).max(240), province: z.string().trim().max(100).optional(), district: z.string().trim().max(100).optional() }), note: z.string().trim().max(1000).optional(), gift: z.object({ enabled: z.boolean(), recipientName: z.string().trim().max(120).optional(), wish: z.string().trim().max(500).optional() }).default({ enabled: false })
});

publicRouter.post('/orders', rateLimit({ windowMs: 60_000, limit: 8, standardHeaders: true, legacyHeaders: false }), async (req, res) => {
  const key = String(req.header('Idempotency-Key') || '').trim();
  if (!key || key.length > 120) return res.status(400).json({ message: 'Thiếu mã phiên đặt hàng. Vui lòng thử lại.' });
  if (process.env.MONGODB_URI && (await Order.exists({ idempotencyKey: key }))) {
    const old = await Order.findOne({ idempotencyKey: key }).lean();
    return res.status(200).json({ data: { orderCode: old?.orderCode, status: old?.status, replayed: true } });
  }
  try {
    if (!env.MONGODB_URI) return res.status(503).json({ message: 'Hệ thống chưa kết nối MongoDB. Shop cần bổ sung MONGODB_URI.' });
    const input = orderInput.parse(req.body);
    const lines = input.items.map((requested) => {
      const product = products.find((candidate) => candidate.id === requested.productId);
      if (!product) throw new Error('Một sản phẩm trong giỏ không còn khả dụng.');
      return { productId: product.id, name: product.name, category: product.categoryLabel, price: product.price, quantity: requested.quantity, image: product.image, lineTotal: product.price * requested.quantity };
    });
    const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const gift = input.gift.enabled ? input.gift : { enabled: false };
    const order = await Order.create({ orderCode: orderCode(), idempotencyKey: key, customer: input.customer, items: lines, subtotal: total, total, note: input.note, gift, emailDelivery: { status: env.BREVO_API_KEY ? 'pending' : 'not_configured', attempts: 0 } });
    try {
      const result = await sendNewOrderEmail(order.toObject());
      await Order.updateOne({ _id: order._id }, { $set: { 'emailDelivery.status': result.skipped ? 'not_configured' : 'sent', 'emailDelivery.sentAt': result.sent ? new Date() : undefined }, $inc: { 'emailDelivery.attempts': 1 } });
    } catch (error) {
      await Order.updateOne({ _id: order._id }, { $set: { 'emailDelivery.status': 'failed', 'emailDelivery.lastError': error instanceof Error ? error.message : 'Email error' }, $inc: { 'emailDelivery.attempts': 1 } });
      console.error('Brevo delivery failed for order', order.orderCode, error instanceof Error ? error.message : 'unknown error');
    }
    return res.status(201).json({ data: { orderCode: order.orderCode, status: order.status, total: order.total } });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: error.issues[0]?.message || 'Thông tin đơn hàng chưa hợp lệ.' });
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Không thể tạo đơn hàng.' });
  }
});
