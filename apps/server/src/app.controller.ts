import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { apiContracts } from 'api-types';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @TsRestHandler(apiContracts.root)
  async handler() {
    return tsRestHandler(apiContracts.root, {
      getHello: async () => {
        return {
          status: 200,
          body: await this.appService.getHello(),
        };
      },
    });
  }
}
