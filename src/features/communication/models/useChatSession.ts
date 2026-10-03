import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { chatApi } from '@/lib/zodiosClients';
import { parseInstant } from '@/shared/time';
import { getToken, getUserProfile } from '@/lib/tokenStore';
import { type ChatMessage, type TypingIndicator } from '@/types';
import { useChatWebSocket } from '@features/communication/models/useChatWebSocket';

/**
 * One order's conversation: the session, the socket, the message list, typing indicators,
 * the unread count and the two ways to send something.
 *
 * Lifted verbatim out of a 549-line `ChatWidget`. The unread count in particular is easy to
 * get wrong twice — it has to ignore the viewer's own messages and reset when the panel
 * opens — and it belongs beside the socket that feeds it rather than beside the markup.
 */

export interface CanonicalChatParticipant {
  userId: string;
  entityType: string;
  displayName?: string;
}

interface UseChatSessionOptions {
  orderId: string;
  isOpen: boolean;
  showError: (message: string) => void;
}

export const MAX_CHAT_MESSAGE_LENGTH = 10_000;

/** The history page size the UI asks for; the server allows up to 100. */
const HISTORY_PAGE_SIZE = 50;

/** One list in time order: history merged with what is already shown, each message once (by id). */
function mergeHistory(current: ChatMessage[], history: ChatMessage[]): ChatMessage[] {
  const byId = new Map(history.map(message => [message.id, message]));
  for (const message of current) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => parseInstant(a.timestamp) - parseInstant(b.timestamp));
}

export function useChatSession({
  orderId, isOpen, showError,
}: UseChatSessionOptions) {
  const token = getToken();
  const user = getUserProfile();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Pages of history older than the newest window: the next page to ask for, whether the server
  // says there is one, and whether a request for it is in flight.
  const [olderHistory, setOlderHistory] = useState({ nextPage: 1, hasMore: false, loading: false });
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionInitError, setSessionInitError] = useState(false);
  const [sessionRetryAttempt, setSessionRetryAttempt] = useState(0);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<CanonicalChatParticipant[]>([]);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  // The refs the session owns: where to scroll, the per-user typing timers, and the two
  // file inputs an image can arrive through.
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const previousOrderIdRef = useRef(orderId);
  const showErrorRef = useRef(showError);
  useLayoutEffect(() => { showErrorRef.current = showError; }, [showError]);

  // A widget can stay mounted while its parent selects another order. Clear every order-scoped
  // value before initializing the new chat so a prior order's session or messages cannot remain
  // visible or be used for a new order.
  useEffect(() => {
    if (previousOrderIdRef.current === orderId) return;
    previousOrderIdRef.current = orderId;
    Object.values(typingTimeoutRef.current).forEach(clearTimeout);
    typingTimeoutRef.current = {};
    setSessionId(null);
    setMessages([]);
    setParticipants([]);
    setTargetUserId(null);
    setInputText('');
    setUnreadCount(0);
    setIsTyping({});
    setSessionInitError(false);
    setSessionRetryAttempt(0);
    setIsRefundModalOpen(false);
  }, [orderId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

useEffect(() => {
  scrollToBottom();
}, [messages, isTyping, isOpen]);

const isOpenRef = useRef(isOpen);
useLayoutEffect(() => {
  isOpenRef.current = isOpen;
}, [isOpen]);

// Handle incoming WebSocket messages
const handleMessageReceived = useCallback((msg: ChatMessage) => {
  setMessages(prev => {
    // Prevent duplicates if STOMP delivers the same message twice
    if (prev.some(m => m.id === msg.id)) return prev;
    return [...prev, msg];
  });
  // If they sent a message, they aren't just typing anymore
  setIsTyping(prev => ({ ...prev, [msg.senderId]: false }));

  // Play notification sound if message is from someone else and chat is closed
  if (msg.senderId !== user?.id) {
    if (isOpenRef.current) {
      // Play small blip when message is received while chat is open
      const audio = new Audio('/sounds/beep_short.wav');
      audio.volume = 0.5;
      audio.play().catch(() => { });
    } else {
      setUnreadCount(prev => prev + 1);
      try {
        const audio = new Audio('/sounds/beep_short.wav');
        audio.play().catch(e => console.warn('Audio play blocked:', e));
      } catch {
        // best effort: a notification sound is not worth surfacing
      }
    }
  }
}, [user?.id]);

// Handle typing indicators
const handleTypingIndicator = useCallback((indicator: TypingIndicator) => {
  if (indicator.userId === user?.id) return; // ignore our own typing

  setIsTyping(prev => ({ ...prev, [indicator.userId]: true }));

  // Clear typing status after 3 seconds of silence
  if (typingTimeoutRef.current[indicator.userId]) {
    clearTimeout(typingTimeoutRef.current[indicator.userId]);
  }
  typingTimeoutRef.current[indicator.userId] = setTimeout(() => {
    setIsTyping(prev => ({ ...prev, [indicator.userId]: false }));
  }, 3000);
}, [user?.id]);

const { isConnected, sendMessage, sendImage, sendTypingIndicator } = useChatWebSocket({
  sessionId,
  onMessageReceived: handleMessageReceived,
  onTypingIndicator: handleTypingIndicator,
});

const handleRefundSubmit = (items: { itemId: string; quantity: number }[], reason: string): boolean => {
  if (user?.role !== 'CUSTOMER') {
    showError('Only the customer who placed this order can request a refund.');
    return false;
  }
  if (!isConnected || !orderId) {
    showError('Chat is reconnecting. Your refund quote was not sent. Please try again when connected.');
    return false;
  }

  const sent = sendMessage(JSON.stringify({
    orderId,
    refundType: "PARTIAL",
    reason,
    items
  }), 'REFUND_QUOTE_REQUEST');
  if (!sent) {
    showError('Chat is reconnecting. Your refund quote was not sent. Please try again when connected.');
  }
  return sent;
};

const uploadedImageCount = messages.filter(
  (msg) => msg.messageType === 'IMAGE' && msg.senderId === user?.id
).length;
const isImageUploadDisabled = uploadedImageCount >= 4 || !isConnected || isLoading;

const retrySession = useCallback(() => {
  setSessionInitError(false);
  setSessionRetryAttempt((attempt) => attempt + 1);
}, []);

// Initialize session when chat is opened for the first time
useEffect(() => {
  if (isOpen && !sessionId && orderId && token && user) {
    let cancelled = false;
    const initChat = async () => {
      setIsLoading(true);
      setSessionInitError(false);
      try {
        // The order owns chat membership. The browser only requests the order's session.
        const data = await chatApi.chatSession.post(`/api/v1/chat/sessions`, { orderId });

        if (cancelled) return;
        if (!data || !data.success || !data.data) throw new Error('Failed to init chat session');
        const session = data.data;
        const sid = session.sessionId as string;
        setSessionId(sid);

        const canonicalParticipants = (session.participants ?? []) as CanonicalChatParticipant[];
        setParticipants(canonicalParticipants);
        const otherParticipant = canonicalParticipants.find((p) => p.userId !== user.id);
        setTargetUserId(otherParticipant?.userId ?? null);

      } catch {
        if (cancelled) return;
        console.error("Error initializing chat session.");
        setSessionInitError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    initChat();
    return () => {
      cancelled = true;
    };
  }
  return undefined;
 
}, [isOpen, sessionId, orderId, token, user, sessionRetryAttempt]);

// Saving sessionId ends initialization. Give history its own lifetime so that cleanup
// cannot discard its response or leave the composer in the initialization spinner.
useEffect(() => {
  if (!sessionId) return;
  let cancelled = false;
  const loadHistory = async () => {
    try {
      const response = await chatApi.chatSession.get('/api/v1/chat/sessions/:sessionId/messages',
        { params: { sessionId }, queries: { page: 0, size: HISTORY_PAGE_SIZE } });
      if (cancelled || !response?.success) return;
      setMessages(current => mergeHistory(current, (response.data?.content as ChatMessage[]) ?? []));
      setOlderHistory({ nextPage: 1, hasMore: response.data?.last === false, loading: false });
    } catch {
      if (cancelled) return;
      console.error('Error loading chat history.');
      showErrorRef.current('Chat connected, but previous messages could not be loaded.');
    }
  };
  void loadHistory();
  return () => { cancelled = true; };
}, [sessionId]);

/**
 * The next page back. Page 0 is the newest window; a message that arrives meanwhile only pushes
 * older ones further back, so a page can repeat a message (dropped by id) but never skip one.
 */
const loadOlderMessages = async () => {
  if (!sessionId || !olderHistory.hasMore || olderHistory.loading) return;
  const page = olderHistory.nextPage;
  setOlderHistory(state => ({ ...state, loading: true }));
  try {
    const response = await chatApi.chatSession.get('/api/v1/chat/sessions/:sessionId/messages',
      { params: { sessionId }, queries: { page, size: HISTORY_PAGE_SIZE } });
    if (!response?.success) throw new Error('History page refused');
    setMessages(current => mergeHistory(current, (response.data?.content as ChatMessage[]) ?? []));
    setOlderHistory({ nextPage: page + 1, hasMore: response.data?.last === false, loading: false });
  } catch {
    setOlderHistory(state => ({ ...state, loading: false }));
    showErrorRef.current('Earlier messages could not be loaded. Please try again.');
  }
};

const handleSend = (e?: React.FormEvent) => {
  e?.preventDefault();
  const content = inputText.trim();
  if (!content || !isConnected || !user) return;
  if (content.length > MAX_CHAT_MESSAGE_LENGTH) {
    showError(`Messages can contain up to ${MAX_CHAT_MESSAGE_LENGTH.toLocaleString()} characters.`);
    return;
  }

  const sent = sendMessage(content, 'TEXT');
  if (!sent) {
    showError('Chat is reconnecting. Your message was not sent. Please try again when connected.');
    return;
  }
  setInputText('');
};

const isMessageTooLong = inputText.trim().length > MAX_CHAT_MESSAGE_LENGTH;

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !sendImage) return;

  // Clear both inputs so the same file can be selected again
  if (fileInputRef.current) fileInputRef.current.value = '';
  if (cameraInputRef.current) cameraInputRef.current.value = '';

  if (uploadedImageCount >= 4) {
    showError("You can attach at most 4 images to a chat session.");
    return;
  }

  setIsLoading(true);
  const imageUrl = await sendImage(file);
  if (!imageUrl) {
    showError("Could not upload that image. Check it is under 5MB and try again.");
  }
  setIsLoading(false);
};

  return {
    unreadCount, setUnreadCount,
    sessionId, messages, setMessages,
    inputText, setInputText,
    isLoading, isTyping, targetUserId, isMessageTooLong,
    participants,
    sessionInitError, retrySession,
    isRefundModalOpen, setIsRefundModalOpen,
    handleSend, handleImageUpload, handleRefundSubmit,
    messagesEndRef, fileInputRef, cameraInputRef,
    isConnected, sendMessage, sendTypingIndicator, uploadedImageCount, isImageUploadDisabled,
    hasOlderMessages: olderHistory.hasMore, isLoadingOlderMessages: olderHistory.loading, loadOlderMessages,
  };
}
