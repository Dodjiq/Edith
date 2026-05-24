import { Injectable, Logger } from '@nestjs/common';
import { RealtimeMessage } from 'api-types';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(private readonly gateway: RealtimeGateway) {}

  dispatchMessage<TPayload>(message: RealtimeMessage<TPayload>): void {
    this.gateway.broadcastMessage(message);
  }
}
