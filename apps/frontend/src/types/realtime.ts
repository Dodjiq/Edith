import { RealtimeMessage, RealtimeMessageType } from 'api-types';

export type WebSocketConnectionState =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected';

export type WebSocketMessageHandler = (message: RealtimeMessage<unknown>) => void;

export interface WebSocketContextValue {
  registerHandler: (
    messageType: RealtimeMessageType,
    handler: WebSocketMessageHandler,
  ) => () => void;
  connectionState: WebSocketConnectionState;
}
