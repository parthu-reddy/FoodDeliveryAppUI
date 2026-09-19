import { PhoneCall, PhoneOff } from 'lucide-react';
import React from 'react';
import type { ChatMessage } from '@/types';
import { formatINR } from '@shared/money';
import { SENDER_LABEL } from '@features/communication/models/chatParticipant';
import { Spinner } from '@shared/ui';

/**
 * The messages themselves, including the refund-quote cards that arrive as messages.
 *
 * 111 lines out of a 549-line `ChatWidget`. A refund quote is a message with structured
 * content rather than a separate surface, which is why it renders here and not in a panel of
 * its own — the customer reads it in the order it was said.
 */

interface ChatMessageListProps {
  messages: ChatMessage[];
  userId?: string;
  orderId: string;
  /** Sends a structured reply — a refund quote is answered from inside the thread. */
  sendMessage: (content: string, type: string) => void;
}

export function ChatMessageList({ messages, userId, orderId, sendMessage }: ChatMessageListProps) {
  const user = { id: userId };
  return (
    <>
      {messages.map((msg, idx) => {
  const isMe = msg.senderId === user?.id;

  const typeLabel = SENDER_LABEL[msg.senderType];

  const showHeader = idx === 0 || messages[idx - 1].senderId !== msg.senderId;

  return (
    <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      {showHeader && (
        <span className="text-xs text-slate-500 mb-1 ml-1 mr-1">
          {isMe ? 'You' : `${msg.senderName} (${typeLabel})`}
        </span>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe
 ? 'bg-amber-600 text-white rounded-tr-md'
 : 'bg-white border border-slate-200 text-slate-800 rounded-tl-md'
 }`}
      >
        {msg.content === '[SYSTEM_MISSED_CALL]' ? (
          <div className="flex items-center space-x-2 font-semibold text-rose-500">
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
        ) : msg.messageType === 'REFUND_QUOTE_RESPONSE' ? (() => {
          try {
            const payload = JSON.parse(msg.content);
            return (
              <div className={`flex flex-col space-y-3 p-2 min-w-[220px] ${isMe ? 'text-white' : 'text-slate-800'}`}>
                <div className={`flex items-center space-x-2 border-b pb-2 ${isMe ? 'border-amber-400' : 'border-slate-200'}`}>
                  <span className="text-xl">💰</span>
                  <span className="font-semibold">Refund Quote</span>
                </div>
                <div>
                  <div className="text-sm opacity-80 mb-1">Eligible Amount:</div>
                  <div className="font-bold text-2xl">{formatINR(payload.quoteAmount)}</div>
                </div>
                <div className="text-xs opacity-75">Type: {payload.refundType}</div>
                <button 
                  onClick={() => {
                    sendMessage(JSON.stringify({ orderId, reason: "Customer requested", refundType: payload.refundType, customerId: user?.id }), 'REFUND_REQUEST');
                  }}
                  className={`w-full font-semibold py-2 rounded-xl transition ${
 isMe 
 ? 'bg-white text-amber-600 hover:bg-amber-50' 
 : 'bg-amber-600 text-white hover:bg-amber-700 '
 }`}
                >
                  Accept & Process Refund
                </button>
              </div>
            );
          } catch {
            return <span>Invalid quote response</span>;
          }
        })() : msg.messageType === 'REFUND_DECISION' ? (() => {
          try {
            const payload = JSON.parse(msg.content);
            return (
              <div className="flex flex-col space-y-2 p-2">
                <div className="flex items-center space-x-2 text-amber-600 font-bold">
                  <span className="text-lg">✅</span>
                  <span>Refund Request Submitted</span>
                </div>
                <div className="text-sm font-medium">Amount: {formatINR(payload.amount || payload.quoteAmount || 0)}</div>
                <div className="text-xs opacity-75 mt-1">Check your dashboard for details.</div>
              </div>
            );
          } catch { return <span>Invalid decision response</span>; }
        })() : msg.messageType === 'REFUND_ERROR' ? (() => {
          let errorMessage = msg.content;
          try {
            const payload = JSON.parse(msg.content);
            errorMessage = payload.error || payload.message || msg.content;
          } catch { /* ignore */ }
          return (
            <div className="flex flex-col space-y-1 p-2">
              <div className="flex items-center space-x-2 text-rose-500 font-bold">
                <span>❌</span>
                <span>Request Failed</span>
              </div>
              <span className="text-sm">{errorMessage}</span>
            </div>
          );
        })() : msg.messageType === 'REFUND_QUOTE_REQUEST' || msg.messageType === 'REFUND_REQUEST' ? (
          <div className="flex items-center space-x-2 p-1 opacity-90">
            <Spinner size="sm" label="" />
            <span className="text-sm font-medium">
              {msg.messageType === 'REFUND_QUOTE_REQUEST' ? 'Requesting quote...' : 'Processing refund...'}
            </span>
          </div>
        ) : (
          msg.content
        )}
      </div>
    </div>
  );
})}
    </>
  );
}
