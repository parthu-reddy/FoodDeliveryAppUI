import { useState, useEffect, useCallback, useRef } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { getToken } from '../lib/tokenStore';

export interface ChatMessage {
  id?: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  senderType: 'CUSTOMER' | 'RESTAURANT' | 'DELIVERY';
  messageType: 'TEXT' | 'IMAGE' | 'SYSTEM';
  content: string;
  timestamp: string;
}

export interface TypingIndicator {
  userId: string;
  typing: boolean;
}

interface UseChatWebSocketProps {
  sessionId: string | null;
  onMessageReceived: (msg: ChatMessage) => void;
  onTypingIndicator: (indicator: TypingIndicator) => void;
}

export const useChatWebSocket = ({ sessionId, onMessageReceived, onTypingIndicator }: UseChatWebSocketProps) => {
  const token = getToken();
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const typingSubscriptionRef = useRef<StompSubscription | null>(null);

  useEffect(() => {
    if (!sessionId || !token) {
      return;
    }

    const client = new Client({
      brokerURL: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/chat?token=${token}`,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => {
        // console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setIsConnected(true);
      
      // Subscribe to messages
      subscriptionRef.current = client.subscribe(
        `/topic/chat/${sessionId}`,
        (message: IMessage) => {
          if (message.body) {
            const chatMsg = JSON.parse(message.body) as ChatMessage;
            onMessageReceived(chatMsg);
          }
        }
      );

      // Subscribe to typing indicators
      typingSubscriptionRef.current = client.subscribe(
        `/topic/chat/${sessionId}/typing`,
        (message: IMessage) => {
          if (message.body) {
            const indicator = JSON.parse(message.body) as TypingIndicator;
            onTypingIndicator(indicator);
          }
        }
      );
    };

    client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    client.onWebSocketClose = () => {
      setIsConnected(false);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      if (typingSubscriptionRef.current) {
        typingSubscriptionRef.current.unsubscribe();
      }
      client.deactivate();
      setIsConnected(false);
    };
  }, [sessionId, token, onMessageReceived, onTypingIndicator]);

  const sendMessage = useCallback((content: string, messageType: string = 'TEXT', senderName: string, senderType: string) => {
    if (clientRef.current && clientRef.current.connected && sessionId) {
      const request = {
        content,
        messageType,
        senderName,
        senderType
      };
      clientRef.current.publish({
        destination: `/app/chat.send/${sessionId}`,
        body: JSON.stringify(request)
      });
    } else {
      console.warn("Cannot send message, STOMP client is not connected.");
    }
  }, [sessionId]);

  const sendTypingIndicator = useCallback(() => {
    if (clientRef.current && clientRef.current.connected && sessionId) {
      clientRef.current.publish({
        destination: `/app/chat.typing/${sessionId}`,
        body: JSON.stringify({})
      });
    }
  }, [sessionId]);

  return { isConnected, sendMessage, sendTypingIndicator };
};
