import { Schema, model } from 'mongoose';

const itemSchema = new Schema({ productId: { type: String, required: true }, name: { type: String, required: true }, category: String, price: { type: Number, required: true, min: 0 }, quantity: { type: Number, required: true, min: 1, max: 20 }, image: String, lineTotal: { type: Number, required: true, min: 0 } }, { _id: false });
const customerSchema = new Schema({ fullName: { type: String, required: true, trim: true }, phone: { type: String, required: true, trim: true, index: true }, email: { type: String, trim: true, lowercase: true }, birthYear: { type: Number, min: 1900, max: 2026 }, gender: { type: String, enum: ['female', 'male', 'other', 'prefer-not-to-say'] }, address: { type: String, required: true, trim: true }, province: { type: String, trim: true }, district: { type: String, trim: true } }, { _id: false });
customerSchema.path('birthYear').required(true);
customerSchema.path('gender').required(true);
const paymentProofSchema = new Schema({ data: { type: String, required: true }, fileName: { type: String, maxlength: 180 }, mimeType: { type: String, enum: ['image/jpeg', 'image/png', 'image/webp'] }, uploadedAt: { type: Date, default: Date.now }, status: { type: String, enum: ['pending_review', 'approved', 'rejected'], default: 'pending_review' } }, { _id: false });

const orderSchema = new Schema({
  orderCode: { type: String, unique: true, index: true, required: true }, idempotencyKey: { type: String, unique: true, index: true, required: true },
  customer: { type: customerSchema, required: true }, items: { type: [itemSchema], required: true }, subtotal: { type: Number, required: true, min: 0 }, total: { type: Number, required: true, min: 0 }, note: { type: String, trim: true, maxlength: 1000 },
  gift: { enabled: { type: Boolean, default: false }, recipientName: { type: String, trim: true, maxlength: 120 }, wish: { type: String, trim: true, maxlength: 500 } }, paymentProof: { type: paymentProofSchema, required: true }, orderMethod: { type: String, enum: ['website'], default: 'website' },
  status: { type: String, enum: ['pending', 'confirmed', 'processing', 'completed', 'cancelled'], default: 'pending', index: true }, paymentStatus: { type: String, enum: ['unpaid', 'paid', 'failed', 'refunded'], default: 'unpaid', index: true },
  emailDelivery: { status: { type: String, enum: ['not_configured', 'pending', 'sent', 'failed'], default: 'not_configured' }, attempts: { type: Number, default: 0 }, lastError: String, sentAt: Date },
}, { timestamps: true });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'customer.fullName': 'text', 'customer.phone': 'text' });
export const Order = model('Order', orderSchema);
