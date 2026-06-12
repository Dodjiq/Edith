import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagesModule } from './messages/messages.module';
import { ConfigModule } from '@nestjs/config';
import { RealtimeModule } from './realtime/realtime.module';
import { ToolsModule } from './ai-gateway/tools/tools.module';
import { AudioModule } from './audio/audio.module';
import { CaptionsModule } from './captions/captions.module';
import { ElevenlabsModule } from './elevenlabs/elevenlabs.module';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { DevServerShutdownService } from './common/shutdown/dev-server-shutdown.service';
import { PromptsService } from './prompts/prompts.service';
import { UploadController } from './upload/upload.controller';
import { AwsService } from './aws/aws.service';
import { UploadService } from './upload/upload.service';
import { TwelveLabsService } from './video-analysis/twelve-labs/twelve-labs.service';
import { VideoAnalysisService } from './video-analysis/video-analysis.service';
import { RenderModule } from './render/render.module';
import { SupabaseModule } from './supabase/supabase.module';
import { EdithModule } from './edith/edith.module';
import { StripeModule } from './stripe/stripe.module';

@Module({
  imports: [
    MessagesModule,
    RealtimeModule,
    ToolsModule,
    AudioModule,
    CaptionsModule,
    ElevenlabsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RenderModule,
    SupabaseModule,
    EdithModule,
    StripeModule,
  ],
  controllers: [AppController, UploadController],
  providers: [
    AppService,
    DevServerShutdownService,
    PromptsService,
    AwsService,
    UploadService,
    TwelveLabsService,
    VideoAnalysisService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
