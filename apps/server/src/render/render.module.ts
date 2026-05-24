import { Module } from '@nestjs/common';
import { RenderService } from './render.service';
import { RenderController } from './render.controller';
import { AwsService } from '../aws/aws.service';

@Module({
  controllers: [RenderController],
  providers: [RenderService, AwsService],
})
export class RenderModule {}
