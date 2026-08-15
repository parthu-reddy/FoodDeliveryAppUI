import { z } from 'zod';

export const checkoutSchema = z.object({
  specialInstructions: z.string().max(200, 'Instructions too long').optional(),
});

export const namePromptSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name is too long'),
});

export const delaySchema = z.object({
  delayMinutes: z.number().min(1, 'Delay must be at least 1 minute').max(60, 'Maximum delay is 60 minutes'),
  reason: z.string().min(5, 'Reason is too short').max(100, 'Reason is too long')
});
