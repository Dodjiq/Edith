import { NextResponse } from 'next/server';
import { z } from 'zod';
import { editPlanInputSchema, generateMockEditPlan } from '@/lib/edit-plan/generate-edit-plan';
import { completeMockRender, mockUserId, upsertMockProject } from '@/lib/mvp/mock-store';
import { startRenderJob } from '@/lib/modal/client';

const startRenderRequestSchema = editPlanInputSchema.extend({
  projectName: z.string().trim().min(1).max(120).default('Campagne produit Edith'),
  assetId: z.string().optional(),
  storagePath: z.string().optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = startRenderRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid render request', issues: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  const project = upsertMockProject({
    name: input.projectName,
    preset: input.preset,
    platform: input.platform,
    outputFormat: input.format,
    language: input.language,
    instructions: input.instructions,
    variantsCount: input.variantsCount,
  });
  const editPlan = generateMockEditPlan(input);
  const { job, variants } = completeMockRender({ project, editPlan });
  await startRenderJob({
    projectId: project.id,
    userId: mockUserId,
    assetId: input.assetId,
    storagePath: input.storagePath,
    preset: input.preset,
    format: input.format,
    platform: input.platform,
    instructions: input.instructions,
    variantsCount: input.variantsCount,
    language: input.language,
  });

  return NextResponse.json({
    project: { ...project, status: 'completed' },
    job,
    variants,
    mode: 'mock',
  });
}
