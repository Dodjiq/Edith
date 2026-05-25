import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElevenlabsService } from './elevenlabs.service';

@Module({
  imports: [ConfigModule],
  providers: [ElevenlabsService],
  exports: [ElevenlabsService],
})
export class ElevenlabsModule {}
