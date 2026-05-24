import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SpeechmaticsModule } from '../speechmatics/speechmatics.module';
import { CaptionsController } from './captions.controller';
import { CaptionsService } from './captions.service';

@Module({
  imports: [ConfigModule, SpeechmaticsModule],
  controllers: [CaptionsController],
  providers: [CaptionsService],
  exports: [CaptionsService],
})
export class CaptionsModule {}
