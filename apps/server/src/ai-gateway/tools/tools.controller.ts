import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { apiContracts, ReportToolResultRequest } from 'api-types';
import { ToolsService } from './tools.service';

@Controller()
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @TsRestHandler(apiContracts.tools)
  async handler() {
    return tsRestHandler(apiContracts.tools, {
      reportToolResult: async ({ body }: { body: ReportToolResultRequest }) => {
        const result = this.toolsService.registerToolResult(body);

        return {
          status: 200,
          body: result,
        };
      },
    });
  }
}
