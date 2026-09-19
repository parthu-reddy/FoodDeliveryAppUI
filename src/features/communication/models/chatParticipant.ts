import type { ChatMessage } from '@/types';

/**
 * Who sent a chat message, in words.
 *
 * `ChatWidget` built this with an if-chain over three of the four sender types, so a SYSTEM
 * message rendered its author as "Name ()" — an empty pair of brackets. A total `Record` over
 * the union covers every case and makes a fifth sender type a compile error.
 *
 * These are participant types on a message, not the viewer's role: what a message header says
 * does not change with who is reading it.
 */

export type ChatSenderType = ChatMessage['senderType'];

export const SENDER_LABEL: Record<ChatSenderType, string> = {
  CUSTOMER: 'Customer',
  RESTAURANT: 'Restaurant',
  DELIVERY: 'Rider',
  SYSTEM: 'System',
};
