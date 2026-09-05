import { z } from 'zod';

export const liveTrackingEventSchema = z.object({
  id: z.string().optional(),
  orderId: z.string().optional(),
  status: z.string().optional(),
  deliveryStatus: z.string().optional(),
  deliveryExecutiveId: z.string().optional(),
  deliveryExecutiveName: z.string().optional(),
  riderPhone: z.string().optional(),
  riderLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  estimatedDeliveryTime: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

export type LiveTrackingEvent = z.infer<typeof liveTrackingEventSchema>;

export const chatMessageSchema = z.object({
  id: z.string().optional(),
  sessionId: z.string(),
  senderId: z.string(),
  senderName: z.string(),
  senderType: z.enum(['CUSTOMER', 'RESTAURANT', 'DELIVERY', 'SYSTEM']),
  messageType: z.enum(['TEXT', 'IMAGE', 'AUDIO', 'SYSTEM', 'REFUND_QUOTE_REQUEST', 'REFUND_QUOTE_RESPONSE', 'REFUND_REQUEST', 'REFUND_DECISION', 'REFUND_ERROR']),
  content: z.string(),
  timestamp: z.string(),
}).passthrough();

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const typingIndicatorSchema = z.object({
  userId: z.string(),
  typing: z.boolean(),
}).passthrough();

export type TypingIndicator = z.infer<typeof typingIndicatorSchema>;
