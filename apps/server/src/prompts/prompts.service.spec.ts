import { Test, TestingModule } from '@nestjs/testing';
import { editorToolNames } from 'api-types';
import { PromptsService } from './prompts.service';

describe('PromptsService', () => {
  let service: PromptsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptsService],
    }).compile();

    service = module.get<PromptsService>(PromptsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('routes spoken subtitles to set_captions instead of text overlays', () => {
    const prompt = service.createSystemPrompt({
      [editorToolNames.setCaptions]: {} as never,
      [editorToolNames.delegateTextOverlayTask]: {} as never,
    });

    expect(prompt).toContain('If the user asks for subtitles, captions');
    expect(prompt).toContain(`call ${editorToolNames.setCaptions}`);
    expect(prompt).toContain(`Do not call ${editorToolNames.delegateTextOverlayTask}`);
    expect(prompt).toContain('For new subtitles, pass the video/audio timeline item IDs');
  });

  it('forbids invented data and broad delegate retries', () => {
    const prompt = service.createSystemPrompt({
      [editorToolNames.delegateTextOverlayTask]: {} as never,
      [editorToolNames.delegateMotionDesignTask]: {} as never,
    });

    expect(prompt).toContain('Never invent concrete data, metrics, claims');
    expect(prompt).toContain(
      'For data/stat overlays, only create text when the values or evidence are supplied',
    );
    expect(prompt).toContain('If a delegate tool returns error or timeout');
  });

  it('keeps delegate tool guidance short', () => {
    const prompt = service.createSystemPrompt({
      [editorToolNames.delegateImagePictureTask]: {} as never,
      [editorToolNames.delegateShapeOverlayTask]: {} as never,
      [editorToolNames.delegateMotionDesignTask]: {} as never,
    });

    expect(prompt).toContain('Delegate tools take a short task');
    expect(prompt).toContain('Do not pass snapshots or long analysis');
    expect(prompt).toContain('The specialist can call get_project_state');
    expect(prompt).not.toContain('specialistPrompt');
  });
});
