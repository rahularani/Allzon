import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),

  OTP_PROVIDER: z.enum(['console', 'msg91', 'fast2sms', 'twilio']).default('console'),
  OTP_API_KEY: z.string().optional(),

  CLIENT_BUYER_URL: z.string().url('CLIENT_BUYER_URL must be a valid URL'),
  CLIENT_SUPPLIER_URL: z.string().url('CLIENT_SUPPLIER_URL must be a valid URL'),
  CLIENT_ADMIN_URL: z.string().url('CLIENT_ADMIN_URL must be a valid URL'),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌ Invalid environment variables:\n');
  parsed.error.issues.forEach((issue) => {
    console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
  });
  console.error('\nFix the above issues in your .env file and restart.\n');
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
