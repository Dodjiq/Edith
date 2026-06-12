import { Module } from '@nestjs/common';
import { EdithController } from './edith.controller';
import { EdithService } from './edith.service';
import { EdithRenderService } from './edith-render.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { AwsService } from '../aws/aws.service';

@Module({
  imports: [RealtimeModule],
  controllers: [EdithController],
  providers: [EdithService, EdithRenderService, AwsService],
})
export class EdithModule {}
