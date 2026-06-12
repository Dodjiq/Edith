import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EdithService } from './edith.service';

interface GenerateProjectBody {
  projectId: string;
  userId: string;
}

@Controller('edith')
export class EdithController {
  constructor(private readonly edithService: EdithService) {}

  @Post('generate')
  async generateProject(@Body() body: GenerateProjectBody) {
    return this.edithService.generateProject({
      projectId: body.projectId,
      userId: body.userId,
    });
  }

  @Get('jobs/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.edithService.getJobStatus(jobId);
  }
}
