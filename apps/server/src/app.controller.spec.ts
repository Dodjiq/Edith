import { Test, TestingModule } from '@nestjs/testing';
import { apiContracts } from 'api-types';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello from the backend!"', async () => {
      const handler = await appController.handler();

      const response = await handler.getHello({
        headers: {},
      });

      const body = response.body as { message: string };
      expect(body.message).toBe('Hello from the backend!');
    });
  });
});
