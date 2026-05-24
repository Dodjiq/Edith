import { Controller, Logger } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { apiContracts } from 'api-types';
import { CaptionsService } from './captions.service';

@Controller()
export class CaptionsController {
  private readonly logger = new Logger(CaptionsController.name);

  constructor(private readonly captionsService: CaptionsService) {}

  @TsRestHandler(apiContracts.captions)
  async handler() {
    return tsRestHandler(apiContracts.captions, {
      generateCaptions: async ({ body }) => {
        try {
          this.logger.log(`Generating captions for file: ${body.fileKey}`);
          const result = await this.captionsService.generateCaptions(body);
          this.logger.log(`Generated ${result.captionsCount} captions`);
          return {
            status: 200 as const,
            body: result,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unable to generate captions';
          this.logger.error(`Caption generation failed: ${message}`);
          return {
            status: 400 as const,
            body: { message },
          };
        }
      },
      getCaptions: async ({ body }) => {
        try {
          this.logger.log(`Fetching captions: ${body.captionsKey}`);
          const result = await this.captionsService.getCaptions(body);
          return {
            status: 200 as const,
            body: result,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unable to fetch captions';
          this.logger.error(`Caption fetch failed: ${message}`);
          return {
            status: 400 as const,
            body: { message },
          };
        }
      },
    });
  }
}
