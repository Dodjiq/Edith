import { NextResponse } from 'next/server';
import { startRenderRequestSchema as sharedStartRenderRequestSchema } from 'api-types';
import { editPlanInputSchema, generateMockEditPlan } from '@/lib/edit-plan/generate-edit-plan';
import { completeMockRender, mockUserId, upsertMockProject } from '@/lib/mvp/mock-store';
import { startRenderJob } from '@/lib/modal/client';
import { checkExportQuota, incrementExportCounter, shouldApplyWatermark } from '@/lib/quota';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';

const startRenderRequestSchema = editPlanInputSchema.merge(sharedStartRenderRequestSchema);

type QuotaErrorBody = {
  error:
    | 'export_quota_exceeded'
    | 'duration_exceeds_plan_limit'
    | 'too_many_variants'
    | 'voiceover_not_in_plan'
    | 'advanced_mode_requires_upgrade'
    | 'plan_resolution_failed';
  plan?: string;
  monthlyExports?: number;
  maxDurationSeconds?: number;
  maxVariantsPerProject?: number;
};

const mapQuotaFailure = (
  reason:
    | 'plan_unknown'
    | 'exceeded'
    | 'duration_too_long'
    | 'too_many_variants'
    | 'voiceover_not_allowed'
    | 'advanced_mode_required',
): { status: number; body: QuotaErrorBody } => {
  switch (reason) {
    case 'exceeded':
      return { status: 402, body: { error: 'export_quota_exceeded' } };
    case 'duration_too_long':
      return { status: 403, body: { error: 'duration_exceeds_plan_limit' } };
    case 'too_many_variants':
      return { status: 403, body: { error: 'too_many_variants' } };
    case 'voiceover_not_allowed':
      return { status: 403, body: { error: 'voiceover_not_in_plan' } };
    case 'advanced_mode_required':
      return { status: 403, body: { error: 'advanced_mode_requires_upgrade' } };
    case 'plan_unknown':
    default:
      return { status: 500, body: { error: 'plan_resolution_failed' } };
  }
};

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

    // Resolve effective asset duration for the plan check.
    // Priority: caller-supplied -> project_assets.duration_seconds -> 0 (skip check).
    // TODO: when the upload flow stores duration before render dispatch we should
    // fall back to a fresh project_assets lookup here instead of trusting the client.
    let effectiveDurationSeconds = input.durationSeconds ?? 0;
    if (!effectiveDurationSeconds && input.assetId) {
      const { data: assetRow } = await adminSupabase
        .from('project_assets')
        .select('duration_seconds')
        .eq('id', input.assetId)
        .maybeSingle();
      const dbDuration = (assetRow as { duration_seconds: number | null } | null)?.duration_seconds;
      if (typeof dbDuration === 'number' && dbDuration > 0) {
        effectiveDurationSeconds = Math.floor(dbDuration);
      }
    }
    if (!effectiveDurationSeconds) {
      console.warn('[render/start] duration unknown — skipping plan duration check', {
        userId: user.id,
        assetId: input.assetId,
      });
    }

    const quota = await checkExportQuota(adminSupabase, user.id, {
      durationSeconds: effectiveDurationSeconds,
      variantsCount: input.variantsCount,
      voiceoverRequested: input.voiceoverRequested ?? false,
      advancedModeRequested: input.advancedModeRequested ?? false,
    });

    if (!quota.ok) {
      const { status, body } = mapQuotaFailure(quota.reason);
      return NextResponse.json(body, { status });
    }

    const plan = quota.plan;
    const applyWatermark = shouldApplyWatermark(plan);

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
        render_metadata: { editPlan, planKey: plan.key, applyWatermark },
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
        applyWatermark,
        planKey: plan.key,
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

      // Modal accepted the job — count one export per committed variant.
      // Counter inconsistencies are recoverable; never fail the render request on this write.
      try {
        await incrementExportCounter(adminSupabase, user.id, input.variantsCount);
      } catch (counterError) {
        console.error('[render/start] export counter increment failed', {
          userId: user.id,
          projectId: project.id,
          variantsCount: input.variantsCount,
          error: counterError instanceof Error ? counterError.message : counterError,
        });
      }

      return NextResponse.json({
        project: { ...project, status: isRealModal ? project.status : 'completed' },
        job: { ...job, status: isRealModal ? job.status : 'completed', modal_job_id: modalJob.jobId },
        variants: isRealModal ? variants : variants.map((variant) => ({ ...variant, status: 'completed' })),
        mode: isRealModal ? 'modal' : 'database-mock',
        plan: plan.key,
        applyWatermark,
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
