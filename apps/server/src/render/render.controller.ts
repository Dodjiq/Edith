import { Controller, Logger } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { apiContracts } from 'api-types';
import { RenderService } from './render.service';

@Controller()
export class RenderController {
  private readonly logger = new Logger(RenderController.name);

  constructor(private readonly renderService: RenderService) {}

  @TsRestHandler(apiContracts.render)
  async handler() {
    return tsRestHandler(apiContracts.render, {
      startRender: async ({ body }) => {
        try {
          const response = await this.renderService.startRender(body);
          return { status: 200 as const, body: response };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Render service unavailable';
          this.logger.error(`Render failed: ${message}`);
          return {
            status: 400 as const,
            body: {
              type: 'error',
              error: message,
            },
          };
        }
      },
    });
  }
}
