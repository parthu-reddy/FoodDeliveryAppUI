import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, MessageSquare, Loader2 } from 'lucide-react';
import { getToken, getUserProfile } from '../lib/tokenStore';
import { useChatWebSocket, ChatMessage, TypingIndicator } from '../hooks/useChatWebSocket';
import { apiGet, apiPost } from '../lib/apiClient';

interface ChatWidgetProps {
  orderId: string;
  currentUserType: 'CUSTOMER' | 'RESTAURANT' | 'DELIVERY';
  onClose?: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ orderId, currentUserType, onClose }) => {
  const token = getToken();
  const user = getUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  // Handle incoming WebSocket messages
  const handleMessageReceived = useCallback((msg: ChatMessage) => {
    setMessages(prev => {
      // Prevent duplicates if STOMP delivers the same message twice
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    // If they sent a message, they aren't just typing anymore
    setIsTyping(prev => ({ ...prev, [msg.senderId]: false }));
  }, []);

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
  }, [user]);

  const { isConnected, sendMessage, sendTypingIndicator } = useChatWebSocket({
    sessionId,
    onMessageReceived: handleMessageReceived,
    onTypingIndicator: handleTypingIndicator,
  });

  // Initialize session when chat is opened for the first time
  useEffect(() => {
    if (isOpen && !sessionId && orderId && token && user) {
      const initChat = async () => {
        setIsLoading(true);
        try {
          // 1. Create or get session
          const data = await apiPost(`/api/v1/chat/sessions`, {
            orderId,
            participants: [
              {
                userId: user.id,
                entityType: currentUserType,
                displayName: user.name || user.email || user.id
              }
            ]
          });
          
          if (!data || !data.success) throw new Error('Failed to init chat session');
          const sid = data.data.sessionId;
          setSessionId(sid);

          // 2. Load history
          const histData = await apiGet(`/api/v1/chat/sessions/${sid}/messages?size=50`);
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

    sendMessage(
      inputText.trim(),
      'TEXT',
      user.name || user.email,
      currentUserType
    );
    
    setInputText('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    sendTypingIndicator();
  };

  // The floating chat button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 z-50 flex items-center justify-center"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  // The open chat window
  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-100">
      {/* Header */}
      <div className="bg-orange-600 text-white p-4 flex justify-between items-center shrink-0">
        <div>
          <h3 className="font-semibold text-lg">Order Chat</h3>
          <p className="text-orange-100 text-sm">Order #{orderId.substring(0,8)}</p>
        </div>
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
                  {msg.content}
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
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-800 placeholder-gray-500"
            disabled={!isConnected || isLoading}
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
