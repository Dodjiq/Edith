import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { ConfigModule } from '@nestjs/config';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { ToolsModule } from '../ai-gateway/tools/tools.module';
import { PromptsService } from '../prompts/prompts.service';

@Module({
  imports: [ConfigModule, RealtimeModule, ToolsModule],
  controllers: [MessagesController],
  providers: [MessagesService, AiGatewayService, PromptsService],
})
export class MessagesModule {}
