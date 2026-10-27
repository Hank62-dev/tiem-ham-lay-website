import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { publicRouter } from './routes/public.js';
import { adminRouter } from './routes/admin.js';

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.CLIENT_URL.split(',').map((value) => value.trim()), credentials: false }));
app.use(express.json({ limit: '64kb' }));
app.get('/health', (_req, res) => res.json({ ok: true, database: mongoose.connection.readyState === 1 ? 'connected' : 'not-connected' }));
app.use('/api', publicRouter);
app.use('/api/admin', adminRouter);
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => { console.error('Unhandled request error', error?.message || error); res.status(500).json({ message: 'Có lỗi máy chủ. Vui lòng thử lại sau.' }); });

if (env.MONGODB_URI) mongoose.connect(env.MONGODB_URI).then(() => console.log('MongoDB connected')).catch((error) => console.error('MongoDB connection failed', error.message));
else console.warn('MONGODB_URI chưa được cấu hình; API tạo đơn sẽ trả về 503.');
app.listen(env.PORT, () => console.log(`HamLay API listening on http://localhost:${env.PORT}`));
