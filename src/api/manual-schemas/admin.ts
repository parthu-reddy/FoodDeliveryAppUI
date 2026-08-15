import { z } from 'zod';

export const adminActionSchema = z.object({
  action: z.string(),
  targetId: z.string().optional(),
  payload: z.any().optional(),
}).passthrough();

export type AdminAction = z.infer<typeof adminActionSchema>;

export const adminMetricSchema = z.object({
  metricName: z.string(),
  value: z.number(),
  timestamp: z.string().optional(),
}).passthrough();

export type AdminMetric = z.infer<typeof adminMetricSchema>;
