import { Controller, Logger } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { apiContracts } from 'api-types';
import { AudioService } from './audio.service';

@Controller()
export class AudioController {
  private readonly logger = new Logger(AudioController.name);

  constructor(private readonly audioService: AudioService) {}

  @TsRestHandler(apiContracts.audio)
  async handler() {
    return tsRestHandler(apiContracts.audio, {
      detectSilence: async ({ body }) => {
        try {
          const result = await this.audioService.detectSilence(body);
          return {
            status: 200 as const,
            body: result,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unable to detect silence';
          this.logger.error(message);
          return {
            status: 400 as const,
            body: { message },
          };
        }
      },
    });
  }
}
