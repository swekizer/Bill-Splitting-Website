import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const createWebSocketClient = ({ onConnect, onError, onDisconnect }) => {
  const rawApiUrl = import.meta.env.VITE_API_URL || '';
  const cleanApiUrl = rawApiUrl.replace(/\/+$/, '');
  const socketUrl = cleanApiUrl + '/ws-billsplit';

  const client = new Client({
    webSocketFactory: () => new SockJS(socketUrl),
    reconnectDelay: 4000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: (frame) => {
      if (onConnect) onConnect(frame);
    },
    onStompError: (frame) => {
      console.error('STOMP broker error:', frame);
      if (onError) onError(frame);
    },
    onWebSocketClose: () => {
      if (onDisconnect) onDisconnect();
    },
  });

  return client;
};
