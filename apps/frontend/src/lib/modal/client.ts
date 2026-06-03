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
  // Quota-derived flags forwarded to the Modal worker. Worker may ignore them
  // until the Python contract catches up — they are purely additive.
  applyWatermark?: boolean;
  planKey?: string;
};

export type RenderJobStatus = {
  jobId: string;
  status: 'queued' | 'transcribing' | 'planning' | 'rendering' | 'completed' | 'failed' | 'cancelled';
};

export const startRenderJob = async (input: StartRenderJobInput): Promise<{ jobId: string }> => {
  if (process.env.ENABLE_REAL_MODAL === 'true') {
    const endpointUrl = process.env.MODAL_RENDER_ENDPOINT_URL;
    const webhookSecret = process.env.MODAL_WEBHOOK_SECRET;

    if (!endpointUrl || !webhookSecret) {
      throw new Error('MODAL_RENDER_ENDPOINT_URL and MODAL_WEBHOOK_SECRET are required when ENABLE_REAL_MODAL=true.');
    }

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${webhookSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project_id: input.projectId,
        user_id: input.userId,
        asset_id: input.assetId,
        storage_path: input.storagePath,
        preset: input.preset,
        format: input.format,
        platform: input.platform,
        instructions: input.instructions,
        variants_count: input.variantsCount,
        language: input.language,
        apply_watermark: input.applyWatermark ?? false,
        plan_key: input.planKey,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Modal render endpoint failed: ${response.status} ${errorText}`);
    }

    const payload = (await response.json()) as { job_id?: string; call_id?: string };
    return { jobId: payload.job_id ?? payload.call_id ?? `modal-${input.projectId}` };
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
