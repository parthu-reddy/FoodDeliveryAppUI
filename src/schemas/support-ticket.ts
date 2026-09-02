import { z } from 'zod';

export const SupportTicketSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  orderId: z.string().uuid(),
  restaurantId: z.string().uuid().optional().nullable(),
  reason: z.string(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SupportTicket = z.infer<typeof SupportTicketSchema>;
