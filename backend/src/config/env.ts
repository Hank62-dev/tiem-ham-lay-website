import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: '.env.development' });
dotenv.config();

const schema = z.object({
  PORT: z.coerce.number().default(5000), NODE_ENV: z.string().default('development'),
  MONGODB_URI: z.string().optional().default(''), CLIENT_URL: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(16).default('local-only-change-this-secret'), ADMIN_EMAIL: z.string().default(''),
  ADMIN_PASSWORD_SALT: z.string().default(''), ADMIN_PASSWORD_HASH: z.string().default(''),
  BREVO_API_KEY: z.string().optional().default(''), BREVO_SENDER_EMAIL: z.string().optional().default(''),
  BREVO_SENDER_NAME: z.string().default('Tiệm Ham Lầy'), SHOP_NOTIFICATION_EMAIL: z.string().default('tiemnhalayhandmade@gmail.com'),
  PUBLIC_SITE_URL: z.string().default('http://localhost:5173'),
});

export const env = schema.parse(process.env);
