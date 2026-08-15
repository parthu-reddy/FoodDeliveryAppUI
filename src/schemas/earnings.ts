import { z } from 'zod';

export const earningRecordSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  amount: z.number(),
  type: z.enum(['payout', 'tip']),
  createdAt: z.string().optional(),
  timestamp: z.string().optional(),
}).passthrough();

export type EarningRecord = z.infer<typeof earningRecordSchema>;
