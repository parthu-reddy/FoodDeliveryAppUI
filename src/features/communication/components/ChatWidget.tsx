import { Surface } from '@shared/ui';
import { useCallContext } from "@/contexts/CallContext";
import { useToast } from "@/contexts/ToastContext";
import { getUserProfile } from "@/lib/tokenStore";
import { useChatSession } from "@features/communication/models/useChatSession";
import { ChatMessageList } from "./ChatMessageList";
import { Camera, ImagePlus, MessageSquare, PhoneCall, Send, X } from 'lucide-react';
import React, { useState, useImperativeHandle } from 'react';
import { RefundRequestModal } from './RefundRequestModal';
import { Spinner } from '@shared/ui';

export interface ChatParticipant {
  userId: string;
  entityType: 'CUSTOMER' | 'RESTAURANT' | 'DELIVERY';
  displayName: string;
  [key: string]: unknown;
}

interface ChatWidgetProps {
  orderId: string;
  currentUserType: 'CUSTOMER' | 'RESTAURANT' | 'DELIVERY' | 'ADMIN';
  otherParticipants?: ChatParticipant[];
  order?: import('@/types').Order; // To pass order details
  onClose?: () => void;
  onBack?: () => void;
}

export interface ChatWidgetHandle {
  openAndRequestRefundQuote: () => void;
  openChatOnly: () => void;
}

export const ChatWidget = React.forwardRef<ChatWidgetHandle, ChatWidgetProps>(({ orderId, order, currentUserType, otherParticipants, onClose, onBack }, ref) => {
  const { showError } = useToast();
  const user = getUserProfile();
  const [isOpen, setIsOpen] = useState(false);

  const {
    unreadCount, setUnreadCount, sessionId, messages,
    inputText, setInputText, isLoading, isTyping, targetUserId,
    isRefundModalOpen, setIsRefundModalOpen,
    handleSend, handleImageUpload, handleRefundSubmit,
    messagesEndRef, fileInputRef, cameraInputRef,
    isConnected, sendMessage, sendTypingIndicator, uploadedImageCount, isImageUploadDisabled,
  } = useChatSession({ orderId, isOpen, currentUserType, otherParticipants, showError });

  useImperativeHandle(ref, () => ({
    openAndRequestRefundQuote: () => {
      setIsOpen(true);
      setUnreadCount(0);
      setIsRefundModalOpen(true);
    },
    openChatOnly: () => {
      setIsOpen(true);
      setUnreadCount(0);
    }
  }));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { startCall, callState, callEndReason, isCaller } = useCallContext();



 

  // The floating chat button
  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setUnreadCount(0);
        }}
        className="fixed bottom-6 right-6 bg-amber-600 hover:bg-amber-700 text-white px-5 py-4 rounded-full transition-transform hover:scale-105 z-50 flex items-center justify-center space-x-2"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="font-bold text-sm">#{orderId.substring(0, 6)}</span>
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  // The open chat window
  return (
    <Surface elevation={2} className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-96 h-[100dvh] sm:h-[500px] max-h-[100dvh] sm:max-h-[calc(100vh-6rem)] sm:rounded-2xl flex flex-col overflow-hidden z-[60] sm:border sm:border-slate-100">
      {/* Header */}
      <div className="bg-amber-600 text-white p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="hover:bg-amber-700 p-1.5 rounded-full transition-colors mr-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
          )}
          <div>
            <h3 className="font-semibold text-lg truncate max-w-[160px] sm:max-w-[200px]">
              {otherParticipants?.length ? otherParticipants.map(p => p.displayName).join(', ') : 'Order Chat'}
            </h3>
            <div className="flex flex-col text-amber-100 text-sm">
              <span>Order #{orderId.substring(0, 8)}</span>
              {order && order.items && order.items.length > 0 && (
                <span className="text-xs opacity-90 truncate max-w-[200px]">
                  {order.items.length} items ({order.items.map((i: import('@/types').OrderItem) => i?.item?.name || i?.name || 'Item').join(', ')})
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
              className="text-white hover:bg-amber-700 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 bg-amber-600/80"
              title={`Call ${p.displayName}`}
            >
              <PhoneCall className="w-4 h-4" />
              <span className="text-[10px] uppercase font-bold tracking-wider">{p.entityType.substring(0, 4)}</span>
            </button>
          )) : (
            targetUserId && sessionId && (
              <button
                onClick={() => startCall(targetUserId, sessionId)}
                className="text-white hover:bg-amber-700 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 bg-amber-600/80"
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
            className="text-white hover:bg-amber-700 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Connection Status */}
      {(!isConnected && sessionId && !isLoading) && (
        <div className="bg-amber-50 text-amber-800 text-xs text-center py-1 font-medium shrink-0">
          Reconnecting to chat server...
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Spinner size="md" className="mb-2" />
            <p>Loading chat...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm text-center">
            <MessageSquare className="w-12 h-12 mb-3 text-slate-300" />
            <p>No messages yet.</p>
            <p>Send a message to start the conversation.</p>
          </div>
        ) : (
            <ChatMessageList messages={messages} userId={user?.id} orderId={orderId} sendMessage={sendMessage} />
        )}

        {/* Typing indicators */}
        {Object.entries(isTyping).filter(([_, isT]) => isT).length > 0 && (
          <div className="flex items-center text-xs text-slate-500 space-x-1">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Someone is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 shrink-0">
        <div className="flex items-center space-x-2 bg-slate-100 rounded-full px-4 py-2">
          {/* Hidden file inputs: one for camera capture, one for gallery */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            ref={cameraInputRef}
            onChange={handleImageUpload}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isImageUploadDisabled}
            title={uploadedImageCount >= 4 ? "Maximum 4 images allowed per session" : "Take Photo"}
            className="p-1.5 text-slate-500 hover:text-amber-600 transition-colors disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImageUploadDisabled}
            title={uploadedImageCount >= 4 ? "Maximum 4 images allowed per session" : "Upload from Gallery"}
            className="p-1.5 text-slate-500 hover:text-amber-600 transition-colors disabled:opacity-50"
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
            className={`p-1.5 rounded-full transition-colors ${inputText.trim() && isConnected
 ? 'bg-amber-600 text-white hover:bg-amber-700'
 : 'bg-slate-300 text-slate-500 cursor-not-allowed'
 }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
      
      {/* Refund Request Modal */}
      {orderId && (
        <RefundRequestModal
          isOpen={isRefundModalOpen}
          onClose={() => setIsRefundModalOpen(false)}
          orderId={orderId}
          onSubmit={handleRefundSubmit}
        />
      )}
    </Surface>
  );
});
