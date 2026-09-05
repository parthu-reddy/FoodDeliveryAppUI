import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().catch(''),
  VITE_API_GATEWAY_URL: z.string().catch(''),
  VITE_WS_GATEWAY_URL: z.string().catch(''),

  VITE_STRIPE_PUBLIC_KEY: z.string().optional(),
  VITE_ENABLE_MOCK_PAYMENT: z.string().optional().transform(v => v === 'true'),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).catch('development'),
  VITE_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).catch('info'),
  VITE_ENABLE_DEV_OTP: z.string().optional().transform(v => v === 'true'),
  MODE: z.string().default('development'),
  DEV: z.boolean().default(true),
}).passthrough(); // Allow other Vite env vars

// Parse and export the env vars safely
// We use import.meta.env, which is injected by Vite
const rawEnv = import.meta.env || {};

// Pre-process env vars to treat empty strings as undefined so catch/default can kick in if needed
const preprocessedEnv = Object.fromEntries(
  Object.entries(rawEnv).map(([key, value]) => [key, value === '' ? undefined : value])
);

const parsed = envSchema.safeParse(preprocessedEnv);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment variables');
}
export const env = parsed.data;
