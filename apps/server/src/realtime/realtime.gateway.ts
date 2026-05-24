import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { RealtimeMessage } from 'api-types';
import { Server, Socket } from 'socket.io';

const defaultAllowedOrigins = [process.env.FRONTEND_URL ?? 'http://localhost:3000'];
const parsedOrigins =
  process.env.WEBSOCKET_ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()) ?? [];
const allowedOrigins =
  parsedOrigins.filter(Boolean).length > 0 ? parsedOrigins : defaultAllowedOrigins;

@WebSocketGateway({
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  private server!: Server;

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  broadcastMessage<TPayload>(message: RealtimeMessage<TPayload>): void {
    if (!this.server) {
      this.logger.error('WebSocket server is not initialized yet');
      return;
    }

    this.server.emit('realtime-message', message);
  }
}
