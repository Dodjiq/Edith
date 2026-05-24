import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Increase JSON body parser limit for large payloads (e.g., captions with thousands of words)
  app.use(json({ limit: '10mb' }));

  // Enable graceful shutdown hooks to properly release port on restart
  app.enableShutdownHooks();

  const parsedPort = Number(process.env.PORT ?? '4000');
  const port = Number.isFinite(parsedPort) ? parsedPort : 4000;
  const host = process.env.HOST ?? '0.0.0.0';

  await app.listen(port, host);
}
bootstrap();
