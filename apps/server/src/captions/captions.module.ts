import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElevenlabsModule } from '../elevenlabs/elevenlabs.module';
import { CaptionsController } from './captions.controller';
import { CaptionsService } from './captions.service';

@Module({
  imports: [ConfigModule, ElevenlabsModule],
  controllers: [CaptionsController],
  providers: [CaptionsService],
  exports: [CaptionsService],
})
export class CaptionsModule {}
