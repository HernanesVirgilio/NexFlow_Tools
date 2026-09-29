import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load the repo-root .env so backend and frontend share one file.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  N8N_BASE_URL: z.string().url().default('http://localhost:5678'),
  N8N_API_KEY: z.string().default(''),
  N8N_TIMEOUT_MS: z.coerce.number().default(15000),

  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  GEMINI_TIMEOUT_MS: z.coerce.number().default(20000),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('NexFlow Tools <no-reply@nexflow.tools>'),
  APP_WEB_URL: z.string().url().default('http://localhost:5173'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const corsOrigins = env.CORS_ORIGIN.split(',').map((s) => s.trim());
