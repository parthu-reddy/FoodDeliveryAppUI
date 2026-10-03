import type { CanonicalChatParticipant } from './useChatSession';

export function canRequestChatRefund(activeRole?: string) {
  return activeRole === 'CUSTOMER';
}

export function otherChatParticipants(participants: CanonicalChatParticipant[], userId?: string, activeRole?: string) {
  return participants.filter(participant => participant.userId !== userId
    && !(activeRole === 'RESTAURANT' && participant.entityType === 'RESTAURANT'));
}
