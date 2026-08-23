import { getToken } from "@/lib/tokenStore";
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ChatMessage, TypingIndicator } from "@/types";

interface UseChatWebSocketProps {
  sessionId: string | null;
  onMessageReceived: (msg: ChatMessage) => void;
  onTypingIndicator: (indicator: TypingIndicator) => void;
  onReconnect?: () => void;
}

export const useChatWebSocket = ({ sessionId, onMessageReceived, onTypingIndicator, onReconnect }: UseChatWebSocketProps) => {
  const token = getToken();
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const typingSubscriptionRef = useRef<StompSubscription | null>(null);
  const isFirstConnectionRef = useRef(true);

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
      
      if (!isFirstConnectionRef.current && onReconnect) {
        onReconnect();
      }
      isFirstConnectionRef.current = false;
      
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
      isFirstConnectionRef.current = true;
    };
  }, [sessionId, token, onMessageReceived, onTypingIndicator, onReconnect]);

  const sendMessage = useCallback((content: string, messageType: string = 'TEXT') => {
    if (clientRef.current && clientRef.current.connected && sessionId) {
      const request = {
        content,
        messageType
      };
      clientRef.current.publish({
        destination: `/app/chat.send/${sessionId}`,
        body: JSON.stringify(request)
      });
    } else {
      console.warn("Cannot send message, STOMP client is not connected.");
    }
  }, [sessionId]);

  const sendImage = useCallback(async (file: File) => {
    if (!sessionId || !token) return null;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await window.fetch(`/api/v1/chat/sessions/${sessionId}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Calling-Service': 'CustomerApplication'
        },
        body: formData
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      if (data.success) {
        return data.data.imageUrl;
      } else {
        console.error("Image upload failed:", data.message);
        return null;
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  }, [sessionId, token]);

  const sendTypingIndicator = useCallback(() => {
    if (clientRef.current && clientRef.current.connected && sessionId) {
      clientRef.current.publish({
        destination: `/app/chat.typing/${sessionId}`,
        body: JSON.stringify({})
      });
    }
  }, [sessionId]);

  return { isConnected, sendMessage, sendImage, sendTypingIndicator };
};
