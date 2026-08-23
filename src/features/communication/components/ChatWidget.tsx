import { useCallContext } from "@/contexts/CallContext";
import { getToken, getUserProfile } from "@/lib/tokenStore";
import { chatApi } from "@/lib/zodiosClients";
import { type ChatMessage, type TypingIndicator } from "@/types";
import { useChatWebSocket } from "@features/communication/models/useChatWebSocket";
import { ImagePlus, Loader2, MessageSquare, PhoneCall, PhoneOff, Send, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface ChatParticipant {
  userId: string;
  entityType: 'CUSTOMER' | 'RESTAURANT' | 'DELIVERY';
  displayName: string;
}

interface ChatWidgetProps {
  orderId: string;
  currentUserType: 'CUSTOMER' | 'RESTAURANT' | 'DELIVERY';
  otherParticipants?: ChatParticipant[];
  order?: any; // To pass order details
  onClose?: () => void;
  onBack?: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ orderId, order, currentUserType, otherParticipants, onClose, onBack }) => {
  const token = getToken();
  const user = getUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  
  const { startCall, callState, callEndReason, isCaller } = useCallContext();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        audio.play().catch(() => {});
      } else {
        setUnreadCount(prev => prev + 1);
        try {
          const audio = new Audio('/sounds/beep_short.wav');
          audio.play().catch(e => console.warn('Audio play blocked:', e));
        } catch (e) {}
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
                      orderId,
                      participants: [
                        {
                          userId: user.id,
                          entityType: currentUserType,
                          displayName: user.name || user.email || user.id
                        },
                        ...(otherParticipants || [])
                      ]
                    });
          
          if (!data || !data.success) throw new Error('Failed to init chat session');
          const sid = data.data.sessionId;
          setSessionId(sid);
          
          if (data.data.participants) {
            const otherParticipant = data.data.participants.find((p: any) => p.userId !== user.id);
            if (otherParticipant) {
              setTargetUserId(otherParticipant.userId);
            }
          }

          // 2. Load history
          const histData = await chatApi.chatSession.get('/api/v1/chat/sessions/:sessionId/messages', { params: { sessionId: sid } });
          if (histData && histData.success) {
            setMessages(histData.data || []);
          }
        } catch (error) {
          console.error("Error initializing chat:", error);
        } finally {
          setIsLoading(false);
        }
      };

      initChat();
    }
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
    
    // Clear the input
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    if (uploadedImageCount >= 4) {
      alert("You have reached the maximum limit of 4 images for this chat session.");
      return;
    }

    setIsLoading(true);
    const imageUrl = await sendImage(file);
    if (!imageUrl) {
      alert("Failed to upload image. Please try again or ensure it is under 5MB.");
    }
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    sendTypingIndicator();
  };

  // The floating chat button
  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setUnreadCount(0);
        }}
        className="fixed bottom-6 right-6 bg-orange-600 hover:bg-orange-700 text-white px-5 py-4 rounded-full shadow-lg transition-transform hover:scale-105 z-50 flex items-center justify-center space-x-2"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="font-bold text-sm">#{orderId.substring(0, 6)}</span>
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  // The open chat window
  return (
    <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-96 h-[100dvh] sm:h-[500px] max-h-[100dvh] sm:max-h-[calc(100vh-6rem)] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[60] sm:border sm:border-gray-100">
      {/* Header */}
      <div className="bg-orange-600 text-white p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="hover:bg-orange-700 p-1.5 rounded-full transition-colors mr-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          <div>
            <h3 className="font-semibold text-lg truncate max-w-[160px] sm:max-w-[200px]">
              {otherParticipants?.length ? otherParticipants.map(p => p.displayName).join(', ') : 'Order Chat'}
            </h3>
            <div className="flex flex-col text-orange-100 text-sm">
              <span>Order #{orderId.substring(0,8)}</span>
            {order && order.items && Array.isArray(order.items) && order.items.length > 0 && (
              <span className="text-xs opacity-90 truncate max-w-[200px]">
                {order.items.length} items ({order.items.map((i: any) => i?.item?.name || i?.name || 'Item').join(', ')})
              </span>
            )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {sessionId && otherParticipants?.length ? otherParticipants.map(p => (
            <button
              key={p.userId}
              onClick={() => startCall(p.userId, sessionId)}
              className="text-white hover:bg-orange-700 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 bg-orange-600/80"
              title={`Call ${p.displayName}`}
            >
              <PhoneCall className="w-4 h-4" />
              <span className="text-[10px] uppercase font-bold tracking-wider">{p.entityType.substring(0,4)}</span>
            </button>
          )) : (
            targetUserId && sessionId && (
              <button
                onClick={() => startCall(targetUserId, sessionId)}
                className="text-white hover:bg-orange-700 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 bg-orange-600/80"
                title="Start Audio Call"
              >
                <PhoneCall className="w-4 h-4" />
                <span className="text-[10px] uppercase font-bold tracking-wider">CALL</span>
              </button>
            )
          )}
          <button 
            onClick={() => {
              setIsOpen(false);
              if (onClose) onClose();
            }}
            className="text-white hover:bg-orange-700 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Connection Status */}
      {(!isConnected && sessionId && !isLoading) && (
        <div className="bg-yellow-50 text-yellow-800 text-xs text-center py-1 font-medium shrink-0">
          Reconnecting to chat server...
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p>Loading chat...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm text-center">
            <MessageSquare className="w-12 h-12 mb-3 text-gray-300" />
            <p>No messages yet.</p>
            <p>Send a message to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === user?.id;
            
            // Format sender label: "Name (Type)"
            let typeLabel = '';
            if (msg.senderType === 'CUSTOMER') typeLabel = 'Customer';
            else if (msg.senderType === 'RESTAURANT') typeLabel = 'Restaurant';
            else if (msg.senderType === 'DELIVERY') typeLabel = 'Rider';
            
            const showHeader = idx === 0 || messages[idx-1].senderId !== msg.senderId;

            return (
              <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {showHeader && (
                  <span className="text-xs text-gray-500 mb-1 ml-1 mr-1">
                    {isMe ? 'You' : `${msg.senderName} (${typeLabel})`}
                  </span>
                )}
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    isMe 
                      ? 'bg-orange-600 text-white rounded-tr-sm' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                  }`}
                >
                  {msg.content === '[SYSTEM_MISSED_CALL]' ? (
                    <div className="flex items-center space-x-2 font-semibold text-red-500">
                      <PhoneOff className="w-4 h-4" />
                      <span>Missed Voice Call</span>
                    </div>
                  ) : msg.content.startsWith('[SYSTEM_CALL_ENDED') ? (
                    <div className="flex items-center space-x-2 font-semibold">
                      <PhoneCall className="w-4 h-4" />
                      <span>Call Ended {msg.content.replace('[SYSTEM_CALL_ENDED ', '').replace(']', '')}</span>
                    </div>
                  ) : msg.messageType === 'IMAGE' ? (
                    <img src={msg.content} alt="Attachment" className="max-w-full rounded-lg" loading="lazy" />
                  ) : msg.messageType === 'AUDIO' ? (
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs font-semibold">📞 Call Recording</span>
                      <audio controls src={msg.content} className="max-w-[200px] h-10" />
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing indicators */}
        {Object.entries(isTyping).filter(([_, isT]) => isT).length > 0 && (
          <div className="flex items-center text-xs text-gray-500 space-x-1">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Someone is typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 shrink-0">
        <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImageUploadDisabled}
            title={uploadedImageCount >= 4 ? "Maximum 4 images allowed per session" : "Upload Image"}
            className="p-1.5 text-gray-500 hover:text-orange-600 transition-colors disabled:opacity-50"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          
          <textarea
            value={inputText}
            onChange={(e) => { 
              setInputText(e.target.value); 
              sendTypingIndicator(); 
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`; // 128px is 8rem (max-h-32)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
                // Reset height
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
              }
            }}
            placeholder="Type a message..."
            className="w-full bg-transparent p-3 outline-none resize-none max-h-32 min-h-[44px]"
            rows={1}
            disabled={!isConnected || isLoading}
            style={{ overflowY: inputText.split('\n').length > 4 ? 'auto' : 'hidden' }}
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || !isConnected}
            className={`p-1.5 rounded-full transition-colors ${
              inputText.trim() && isConnected
                ? 'bg-orange-600 text-white hover:bg-orange-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
