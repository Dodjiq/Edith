import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SpeechmaticsService } from './speechmatics.service';

@Module({
  imports: [ConfigModule],
  providers: [SpeechmaticsService],
  exports: [SpeechmaticsService],
})
export class SpeechmaticsModule {}
