import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { apiContracts } from 'api-types';
import { MessagesService } from './messages.service';

@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @TsRestHandler(apiContracts.messages)
  async handler() {
    return tsRestHandler(apiContracts.messages, {
      sendMessage: async ({ body }) => {
        const response = await this.messagesService.sendMessage(body);

        return {
          status: 200,
          body: response,
        };
      },
      stopMessage: async ({ body }) => {
        const response = await this.messagesService.stopMessage(body);

        return {
          status: 200,
          body: response,
        };
      },
    });
  }
}
