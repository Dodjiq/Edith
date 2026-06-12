import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { RealtimeService } from '../realtime/realtime.service';
import { EdithRenderService } from './edith-render.service';
import { analyzeBrief } from './agents/brief-analyst.agent';
import { buildCreativeStrategy } from './agents/creative-strategist.agent';
import { buildEditPlan } from './agents/edit-planner.agent';

@Injectable()
export class EdithService {
  private readonly logger = new Logger(EdithService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly realtime: RealtimeService,
    private readonly renderService: EdithRenderService,
  ) {}

  async generateProject({ projectId, userId }: { projectId: string; userId: string }) {
    const { data: project } = await this.supabase.client
      .from('projects')
      .select('*, project_assets(*)')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (!project) throw new NotFoundException('Project not found');

    const { data: credits } = await this.supabase.client
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!credits || credits.monthly_exports_used >= credits.monthly_allowance) {
      throw new BadRequestException('Quota mensuel atteint');
    }

    await this.supabase.client.from('projects').update({ status: 'queued' }).eq('id', projectId);

    const clientRequestId = `${projectId}-${Date.now()}`;
    const { data: job } = await this.supabase.client
      .from('render_jobs')
      .insert({
        project_id: projectId,
        user_id: userId,
        status: 'queued',
        preset: project.preset,
        output_format: project.output_format,
        instructions: project.instructions,
        variants_count: project.variants_count,
        client_request_id: clientRequestId,
      })
      .select()
      .single();

    if (!job) throw new Error('Failed to create render job');

    this.runAgentPipeline(project, job).catch((err) =>
      this.logger.error(`Agent pipeline failed for job ${job.id}: ${err instanceof Error ? err.message : String(err)}`),
    );

    return { renderJobId: job.id, status: 'queued' };
  }

  async getJobStatus(jobId: string) {
    const { data } = await this.supabase.client
      .from('render_jobs')
      .select('*, video_variants(*)')
      .eq('id', jobId)
      .single();
    return data;
  }

  private async runAgentPipeline(project: any, job: any): Promise<void> {
    const { id: jobId, user_id: userId } = job;
    const projectId = project.id;

    try {
      await this.supabase.client.from('projects').update({ status: 'planning' }).eq('id', projectId);
      await this.supabase.client
        .from('render_jobs')
        .update({ status: 'planning', started_at: new Date().toISOString() })
        .eq('id', jobId);

      const assets: Array<{ id: string; storage_path: string; duration_seconds: number }> =
        project.project_assets ?? [];

      this.logger.debug(`[job=${jobId}] Analyzing brief`);
      const brief = await analyzeBrief({
        instructions: project.instructions ?? '',
        platform: project.platform ?? 'tiktok',
        preset: project.preset ?? 'ugc_dynamic',
        assetCount: assets.length,
      });

      this.logger.debug(`[job=${jobId}] Building creative strategy`);
      const strategy = await buildCreativeStrategy({
        brief,
        variantsCount: project.variants_count ?? 1,
        platform: project.platform ?? 'tiktok',
      });

      const variantInserts = strategy.variants.map((v, i) => ({
        project_id: projectId,
        user_id: userId,
        name: v.name ?? `Variante ${i + 1}`,
        preset: project.preset,
        status: 'queued',
        edit_plan: {},
      }));

      const { data: variantRows } = await this.supabase.client
        .from('video_variants')
        .insert(variantInserts)
        .select();

      if (!variantRows || variantRows.length === 0) {
        throw new Error('Failed to insert video_variants');
      }

      await this.supabase.client.from('projects').update({ status: 'rendering' }).eq('id', projectId);
      await this.supabase.client.from('render_jobs').update({ status: 'rendering' }).eq('id', jobId);

      const assetList = assets.map((a) => ({
        path: a.storage_path,
        durationSeconds: a.duration_seconds ?? 10,
      }));

      let completedCount = 0;

      for (let i = 0; i < strategy.variants.length; i++) {
        const variant = strategy.variants[i];
        const variantRow = variantRows[i];

        await this.supabase.client
          .from('video_variants')
          .update({ status: 'rendering' })
          .eq('id', variantRow.id);

        try {
          this.logger.debug(`[job=${jobId}] Building edit plan for variant ${i + 1}`);
          const editPlan = await buildEditPlan({
            variant: { marketingAngle: variant.marketingAngle, hookText: variant.hookText },
            assets: assetList,
            outputFormat: project.output_format ?? '9:16',
          });

          await this.supabase.client
            .from('video_variants')
            .update({ edit_plan: editPlan as any })
            .eq('id', variantRow.id);

          const exportUrl = await this.renderService.renderVariant({
            jobId,
            variantId: variantRow.id,
            variantIndex: i,
            editPlan,
            outputFormat: project.output_format ?? '9:16',
          });

          await this.supabase.client
            .from('video_variants')
            .update({ status: 'completed', export_path: exportUrl })
            .eq('id', variantRow.id);

          this.realtime.dispatchMessage({
            type: 'edith:variantComplete',
            payload: { jobId, variantId: variantRow.id, exportPath: exportUrl },
            timestamp: new Date().toISOString(),
          });

          completedCount++;
          this.logger.log(`[job=${jobId}] Variant ${i + 1}/${strategy.variants.length} complete`);
        } catch (variantErr) {
          const errMsg = variantErr instanceof Error ? variantErr.message : String(variantErr);
          this.logger.error(`[job=${jobId}] Variant ${i + 1} failed: ${errMsg}`);
          await this.supabase.client
            .from('video_variants')
            .update({ status: 'failed' })
            .eq('id', variantRow.id);
        }
      }

      const finalStatus = completedCount > 0 ? 'completed' : 'failed';
      await this.supabase.client
        .from('render_jobs')
        .update({ status: finalStatus, completed_at: new Date().toISOString() })
        .eq('id', jobId);
      await this.supabase.client
        .from('projects')
        .update({ status: finalStatus === 'completed' ? 'completed' : 'failed' })
        .eq('id', projectId);

      if (completedCount > 0) {
        await this.supabase.client.rpc('increment_exports_used', { p_user_id: userId });
        this.realtime.dispatchMessage({
          type: 'edith:jobComplete',
          payload: { jobId, projectId, completedVariants: completedCount },
          timestamp: new Date().toISOString(),
        });
        this.logger.log(`[job=${jobId}] Pipeline complete: ${completedCount} variants rendered`);
      } else {
        this.realtime.dispatchMessage({
          type: 'edith:jobFailed',
          payload: { jobId, projectId, error: 'All variants failed to render' },
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[job=${jobId}] Pipeline error: ${errMsg}`);
      await this.supabase.client.from('render_jobs').update({ status: 'failed' }).eq('id', jobId);
      await this.supabase.client.from('projects').update({ status: 'failed' }).eq('id', projectId);
      this.realtime.dispatchMessage({
        type: 'edith:jobFailed',
        payload: { jobId, projectId, error: errMsg },
        timestamp: new Date().toISOString(),
      });
    }
  }
}
