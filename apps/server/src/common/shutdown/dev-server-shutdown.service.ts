import {
  BeforeApplicationShutdown,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Server } from 'node:http';
import { Socket } from 'node:net';

@Injectable()
export class DevServerShutdownService
  implements OnApplicationBootstrap, BeforeApplicationShutdown
{
  private readonly logger = new Logger(DevServerShutdownService.name);
  private readonly sockets = new Set<Socket>();

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  onApplicationBootstrap(): void {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const httpServer = this.httpAdapterHost.httpAdapter?.getHttpServer() as Server | undefined;

    if (!httpServer) {
      this.logger.warn('HTTP server is not available for shutdown tracking');
      return;
    }

    httpServer.on('connection', this.trackSocket);
    this.logger.debug('Development shutdown socket tracking enabled');
  }

  beforeApplicationShutdown(signal?: string): void {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const httpServer = this.httpAdapterHost.httpAdapter?.getHttpServer() as Server | undefined;

    if (!httpServer) {
      return;
    }

    if (signal) {
      this.logger.debug(`Closing tracked sockets after ${signal}`);
    }

    httpServer.closeIdleConnections?.();

    const openSocketsCount = this.sockets.size;

    for (const socket of this.sockets) {
      socket.destroy();
    }

    this.sockets.clear();

    if (openSocketsCount > 0) {
      this.logger.log(`Closed ${openSocketsCount} open socket(s) during shutdown`);
    }
  }

  private readonly trackSocket = (socket: Socket): void => {
    this.sockets.add(socket);
    socket.once('close', () => {
      this.sockets.delete(socket);
    });
  };
}
