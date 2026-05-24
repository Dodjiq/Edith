'use client';

import { RealtimeMessage, RealtimeMessageType } from 'api-types';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { WebSocketConnectionState, WebSocketContextValue, WebSocketMessageHandler } from '@/types/realtime';
import { getWebSocketUrl } from '@/utils/services/backend-url';

const websocketEventName = 'realtime-message';

const WebSocketContext = createContext<WebSocketContextValue | null>(null);
type WebSocketProviderProps = { children: ReactNode };

const resolveWebSocketUrl = (): string => {
  return getWebSocketUrl();
};

const validateIncomingMessage = (message: RealtimeMessage<unknown>): void => {
  const hasType = typeof message?.type === 'string' && message.type.trim().length > 0;

  if (!hasType) {
    throw new Error('Blocked realtime message with missing or invalid "type"');
  }
};

const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>(() => {
    const url = resolveWebSocketUrl();
    return url ? 'connecting' : 'disconnected';
  });
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<Map<RealtimeMessageType, Set<WebSocketMessageHandler>>>(new Map());

  const dispatchMessage = useCallback((message: RealtimeMessage<unknown>) => {
    validateIncomingMessage(message);

    const handlers = handlersRef.current.get(message.type);

    handlers?.forEach((handler) => {
      handler(message);
    });
  }, []);

  useEffect(() => {
    const url = resolveWebSocketUrl();

    if (!url) {
      return;
    }

    const socket = io(url, {
      transports: ['websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnectionState('connected'));
    socket.on('disconnect', (reason) => {
      setConnectionState('disconnected');
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });
    socket.on('connect_error', () => setConnectionState('reconnecting'));
    socket.on('reconnect_attempt', () => setConnectionState('reconnecting'));
    socket.on('reconnect', () => setConnectionState('connected'));
    socket.on(websocketEventName, dispatchMessage);

    return () => {
      socket.off(websocketEventName, dispatchMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [dispatchMessage]);

  const registerHandler = useCallback(
    (messageType: RealtimeMessageType, handler: WebSocketMessageHandler) => {
      const handlers = handlersRef.current.get(messageType) ?? new Set<WebSocketMessageHandler>();

      handlers.add(handler);
      handlersRef.current.set(messageType, handlers);

      return () => {
        handlers.delete(handler);

        if (handlers.size === 0) {
          handlersRef.current.delete(messageType);
        }
      };
    },
    [],
  );

  const value = useMemo<WebSocketContextValue>(
    () => ({
      registerHandler,
      connectionState,
    }),
    [connectionState, registerHandler],
  );

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }

  return context;
};

export default WebSocketProvider;
