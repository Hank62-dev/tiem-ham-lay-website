import { Schema, model } from 'mongoose';

// One document per issued refresh token. A login starts a "family"; every refresh rotates the token inside it.
const refreshTokenSchema = new Schema({
  tokenHash: { type: String, required: true, unique: true },
  family: { type: String, required: true, index: true },
  email: { type: String, required: true },
  familyStartedAt: { type: Date, required: true },
  usedAt: Date,
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
}, { timestamps: true });

export const RefreshToken = model('RefreshToken', refreshTokenSchema);
