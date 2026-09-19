import { useCallback, useEffect, useRef, useState } from 'react';
import { chatApi } from '@/lib/zodiosClients';
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

interface UseChatSessionOptions {
  orderId: string;
  isOpen: boolean;
  currentUserType: string;
  otherParticipants?: { userId: string; entityType: string; displayName: string }[];
  showError: (message: string) => void;
}

export function useChatSession({
  orderId, isOpen, currentUserType, otherParticipants, showError,
}: UseChatSessionOptions) {
  const token = getToken();
  const user = getUserProfile();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  // The refs the session owns: where to scroll, the per-user typing timers, and the two
  // file inputs an image can arrive through.
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

useEffect(() => {
  scrollToBottom();
}, [messages, isTyping, isOpen]);

const isOpenRef = useRef(isOpen);
useEffect(() => {
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

const handleRefundSubmit = (items: { itemId: string; quantity: number }[], reason: string) => {
  if (isConnected && orderId) {
    sendMessage(JSON.stringify({ 
      orderId, 
      refundType: "PARTIAL", 
      reason,
      items 
    }), 'REFUND_QUOTE_REQUEST');
    setIsRefundModalOpen(false);
  }
};

const uploadedImageCount = messages.filter(
  (msg) => msg.messageType === 'IMAGE' && msg.senderId === user?.id
).length;
const isImageUploadDisabled = uploadedImageCount >= 4 || !isConnected || isLoading;

// Initialize session when chat is opened for the first time
useEffect(() => {
  if (isOpen && !sessionId && orderId && token && user) {
    const initChat = async () => {
      setIsLoading(true);
      try {
        // 1. Create or get session
          const data = await chatApi.chatSession.post(`/api/v1/chat/sessions`, {
            id: "",
            orderId,
          participants: [
            {
              userId: user.id,
              entityType: currentUserType,
              displayName: (user.name || user.email || user.id) as string
            },
            ...(otherParticipants || [])
          ]
        });

        if (!data || !data.success || !data.data) throw new Error('Failed to init chat session');
        const session = data.data;
        const sid = session.sessionId as string;
        setSessionId(sid);

        if ((session).participants) {
          const otherParticipant = (session).participants.find((p: { userId: string }) => p.userId !== user.id);
          if (otherParticipant) {
            setTargetUserId(otherParticipant.userId);
          }
        }

        // 2. Load history
        const histData = await chatApi.chatSession.get('/api/v1/chat/sessions/:sessionId/messages', { params: { sessionId: sid } });
        if (histData && histData.success) {
          setMessages((histData.data?.content as ChatMessage[]) ?? []);
        }
      } catch (error: unknown) {
        console.error("Error initializing chat:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
  }
 
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [isOpen, sessionId, orderId, token, user, currentUserType]);

const handleSend = (e?: React.FormEvent) => {
  e?.preventDefault();
  if (!inputText.trim() || !isConnected || !user) return;

  sendMessage(inputText.trim(), 'TEXT');
  setInputText('');
};

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
    isLoading, isTyping, targetUserId,
    isRefundModalOpen, setIsRefundModalOpen,
    handleSend, handleImageUpload, handleRefundSubmit,
    messagesEndRef, fileInputRef, cameraInputRef,
    isConnected, sendMessage, sendTypingIndicator, uploadedImageCount, isImageUploadDisabled,
  };
}
