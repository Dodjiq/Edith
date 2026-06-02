import { NextResponse } from 'next/server';
import { z } from 'zod';
import { editPlanInputSchema, generateMockEditPlan } from '@/lib/edit-plan/generate-edit-plan';
import { completeMockRender, mockUserId, upsertMockProject } from '@/lib/mvp/mock-store';
import { startRenderJob } from '@/lib/modal/client';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';

const startRenderRequestSchema = editPlanInputSchema.extend({
  projectName: z.string().trim().min(1).max(120).default('Campagne produit Edith'),
  assetId: z.string().optional(),
  storagePath: z.string().optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = startRenderRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid render request', issues: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const creditsNeeded = input.variantsCount * 5;
    const editPlan = generateMockEditPlan(input);
    const adminSupabase = createAdminClient();

    const { data: credits } = await adminSupabase
      .from('user_credits')
      .select('balance,reserved')
      .eq('user_id', user.id)
      .maybeSingle();

    if (process.env.BILLING_DISABLED === 'false') {
      const availableCredits = (credits?.balance ?? 0) - (credits?.reserved ?? 0);
      if (availableCredits < creditsNeeded) {
        return NextResponse.json({ error: 'Credits insuffisants pour lancer ce rendu.' }, { status: 402 });
      }
    }

    const { data: project, error: projectError } = await adminSupabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: input.projectName,
        status: 'queued',
        preset: input.preset,
        platform: input.platform,
        output_format: input.format,
        language: input.language,
        instructions: input.instructions,
        variants_count: input.variantsCount,
        settings: { mode: process.env.ENABLE_REAL_MODAL === 'true' ? 'modal' : 'mock' },
      })
      .select()
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: projectError?.message ?? 'Impossible de creer le projet.' }, { status: 500 });
    }

    let assetId = input.assetId;

    if (input.storagePath && input.fileName && input.mimeType) {
      const { data: asset, error: assetError } = await adminSupabase
        .from('project_assets')
        .insert({
          project_id: project.id,
          user_id: user.id,
          file_name: input.fileName,
          mime_type: input.mimeType,
          storage_path: input.storagePath,
          size_bytes: input.sizeBytes,
          status: 'uploaded',
        })
        .select()
        .single();

      if (assetError || !asset) {
        return NextResponse.json({ error: assetError?.message ?? 'Impossible d enregistrer la video.' }, { status: 500 });
      }

      assetId = asset.id;
    }

    const { data: variants, error: variantsError } = await adminSupabase
      .from('video_variants')
      .insert(
        editPlan.variants.map((variant) => ({
          project_id: project.id,
          user_id: user.id,
          name: variant.name,
          preset: input.preset,
          marketing_angle: variant.marketingAngle,
          hook_text: variant.hookText,
          status: 'queued',
          edit_plan: variant,
        })),
      )
      .select();

    if (variantsError || !variants) {
      return NextResponse.json({ error: variantsError?.message ?? 'Impossible de creer les variantes.' }, { status: 500 });
    }

    const { data: job, error: jobError } = await adminSupabase
      .from('render_jobs')
      .insert({
        project_id: project.id,
        user_id: user.id,
        asset_id: assetId,
        status: 'queued',
        preset: input.preset,
        output_format: input.format,
        instructions: input.instructions,
        variants_count: input.variantsCount,
        credits_reserved: creditsNeeded,
        render_metadata: { editPlan },
      })
      .select()
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: jobError?.message ?? 'Impossible de creer le job.' }, { status: 500 });
    }

    if (process.env.BILLING_DISABLED === 'false') {
      const nextReservedCredits = (credits?.reserved ?? 0) + creditsNeeded;
      const nextBalance = credits?.balance ?? 0;
      const { error: reserveCreditsError } = await adminSupabase
        .from('user_credits')
        .upsert({
          user_id: user.id,
          balance: nextBalance,
          reserved: nextReservedCredits,
        });

      if (reserveCreditsError) {
        await adminSupabase.from('render_jobs').update({ status: 'failed', error_message: reserveCreditsError.message }).eq('id', job.id);
        return NextResponse.json({ error: reserveCreditsError.message }, { status: 500 });
      }

      await adminSupabase.from('credit_transactions').insert({
        user_id: user.id,
        project_id: project.id,
        render_job_id: job.id,
        type: 'reserve',
        amount: -creditsNeeded,
        balance_after: nextBalance - nextReservedCredits,
        reason: 'Reservation de credits pour rendu Edith',
        metadata: { variantsCount: input.variantsCount, preset: input.preset },
      });
    }

    try {
      const modalJob = await startRenderJob({
        projectId: project.id,
        userId: user.id,
        assetId,
        storagePath: input.storagePath,
        preset: input.preset,
        format: input.format,
        platform: input.platform,
        instructions: input.instructions,
        variantsCount: input.variantsCount,
        language: input.language,
      });

      const isRealModal = process.env.ENABLE_REAL_MODAL === 'true';

      if (!isRealModal) {
        await Promise.all([
          adminSupabase.from('projects').update({ status: 'completed' }).eq('id', project.id),
          adminSupabase.from('render_jobs').update({ status: 'completed', modal_job_id: modalJob.jobId }).eq('id', job.id),
          adminSupabase.from('video_variants').update({ status: 'completed', render_metadata: { editPlan, mode: 'database-mock' } }).eq('project_id', project.id),
        ]);
      } else {
        await adminSupabase.from('render_jobs').update({ modal_job_id: modalJob.jobId }).eq('id', job.id);
      }

      return NextResponse.json({
        project: { ...project, status: isRealModal ? project.status : 'completed' },
        job: { ...job, status: isRealModal ? job.status : 'completed', modal_job_id: modalJob.jobId },
        variants: isRealModal ? variants : variants.map((variant) => ({ ...variant, status: 'completed' })),
        mode: isRealModal ? 'modal' : 'database-mock',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Modal failed';
      await Promise.all([
        adminSupabase.from('projects').update({ status: 'failed', error_message: message }).eq('id', project.id),
        adminSupabase.from('render_jobs').update({ status: 'failed', error_message: message }).eq('id', job.id),
        adminSupabase.from('video_variants').update({ status: 'failed', error_message: message }).eq('project_id', project.id),
      ]);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

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
