import { generateMockEditPlan, type EdithFormat, type EdithLanguage, type EdithPlatform, type EdithPreset } from '@/lib/edit-plan/generate-edit-plan';

export type StartRenderJobInput = {
  projectId: string;
  userId: string;
  assetId?: string;
  storagePath?: string;
  preset: EdithPreset;
  format: EdithFormat;
  platform: EdithPlatform;
  instructions: string;
  variantsCount: number;
  language: EdithLanguage;
};

export type RenderJobStatus = {
  jobId: string;
  status: 'queued' | 'transcribing' | 'planning' | 'rendering' | 'completed' | 'failed' | 'cancelled';
};

export const startRenderJob = async (input: StartRenderJobInput): Promise<{ jobId: string }> => {
  if (process.env.ENABLE_REAL_MODAL === 'true') {
    throw new Error('Real Modal integration is not implemented yet. Use ENABLE_MOCK_RENDER=true for the MVP.');
  }

  generateMockEditPlan({
    preset: input.preset,
    format: input.format,
    platform: input.platform,
    language: input.language,
    variantsCount: input.variantsCount,
    instructions: input.instructions,
  });

  return { jobId: `mock-modal-${input.projectId}` };
};

export const getRenderJobStatus = async (jobId: string): Promise<RenderJobStatus> => {
  return {
    jobId,
    status: 'completed',
  };
};
