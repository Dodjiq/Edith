import { ArrowRight, ImageOff, Plus, Sparkles } from 'lucide-react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/buttons/button';
import { getCurrentUser } from '@/lib/supabase/project-queries';
import { createAdminClient } from '@/utils/supabase/admin';

type Props = { params: Promise<{ locale: string }> };

type ProjectStatus =
  | 'draft'
  | 'uploaded'
  | 'queued'
  | 'transcribing'
  | 'planning'
  | 'rendering'
  | 'completed'
  | 'failed'
  | 'cancelled';

interface ProjectRow {
  id: string;
  name: string | null;
  status: ProjectStatus;
  preset: string | null;
  platform: string | null;
  output_format: string | null;
  variants_count: number | null;
  created_at: string;
}

interface VariantThumbnailRow {
  project_id: string;
  thumbnail_path: string | null;
  created_at: string;
}

const PROJECT_STATUS_KEYS: readonly ProjectStatus[] = [
  'draft',
  'uploaded',
  'queued',
  'transcribing',
  'planning',
  'rendering',
  'completed',
  'failed',
  'cancelled',
] as const;

const STATUS_BADGE_CLASSES: Record<ProjectStatus, string> = {
  draft: 'border-white/10 bg-white/[0.04] text-neutral-300',
  uploaded: 'border-sky-300/20 bg-sky-300/10 text-sky-200',
  queued: 'border-sky-300/20 bg-sky-300/10 text-sky-200',
  transcribing: 'border-sky-300/20 bg-sky-300/10 text-sky-200',
  planning: 'border-sky-300/20 bg-sky-300/10 text-sky-200',
  rendering: 'border-sky-300/20 bg-sky-300/10 text-sky-200',
  completed: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
  failed: 'border-red-300/20 bg-red-300/10 text-red-200',
  cancelled: 'border-white/10 bg-white/[0.04] text-neutral-400',
};

const isKnownProjectStatus = (value: string): value is ProjectStatus =>
  (PROJECT_STATUS_KEYS as readonly string[]).includes(value);

const isAbsoluteUrl = (value: string): boolean =>
  value.startsWith('http://') || value.startsWith('https://');

const getGradientForProjectId = (projectId: string): string => {
  const gradients = [
    'from-emerald-500/30 via-emerald-700/10 to-neutral-900',
    'from-sky-500/30 via-sky-700/10 to-neutral-900',
    'from-fuchsia-500/30 via-fuchsia-700/10 to-neutral-900',
    'from-amber-500/30 via-amber-700/10 to-neutral-900',
    'from-violet-500/30 via-violet-700/10 to-neutral-900',
  ];
  let hash = 0;
  for (let index = 0; index < projectId.length; index += 1) {
    hash = (hash * 31 + projectId.charCodeAt(index)) % 1000003;
  }
  return gradients[Math.abs(hash) % gradients.length];
};

const formatCreatedAt = (isoDate: string, locale: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  const intlLocale = locale === 'en' ? 'en-US' : 'fr-FR';

  if (Math.abs(diffMinutes) < 60 * 24 * 7) {
    const relativeFormatter = new Intl.RelativeTimeFormat(intlLocale, { numeric: 'auto' });
    if (Math.abs(diffMinutes) < 60) {
      return relativeFormatter.format(-diffMinutes, 'minute');
    }
    const diffHours = Math.round(diffMinutes / 60);
    if (Math.abs(diffHours) < 24) {
      return relativeFormatter.format(-diffHours, 'hour');
    }
    const diffDays = Math.round(diffHours / 24);
    return relativeFormatter.format(-diffDays, 'day');
  }

  return new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const ProjectsListPage = async ({ params }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('projects.projects_list');
  const tProject = await getTranslations('dashboard.project');

  // Middleware enforces auth, but keep a defensive check before issuing the query.
  const { supabase, user } = await getCurrentUser();
  if (!user) {
    notFound();
  }

  const { data: rawProjects } = await supabase
    .from('projects')
    .select('id,name,status,preset,platform,output_format,variants_count,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const projects: ProjectRow[] = (rawProjects ?? []).map((row) => {
    const status = typeof row.status === 'string' && isKnownProjectStatus(row.status)
      ? row.status
      : 'draft';
    return {
      id: String(row.id),
      name: row.name as string | null,
      status,
      preset: row.preset as string | null,
      platform: row.platform as string | null,
      output_format: row.output_format as string | null,
      variants_count: (row.variants_count as number | null) ?? null,
      created_at: String(row.created_at),
    };
  });

  // Thumbnails are looked up with service-role to bypass RLS for cross-row reads.
  const supabaseAdmin = createAdminClient();
  const thumbnailByProjectId = new Map<string, string>();
  if (projects.length > 0) {
    const { data: variantRows } = await supabaseAdmin
      .from('video_variants')
      .select('project_id,thumbnail_path,created_at')
      .in('project_id', projects.map((project) => project.id))
      .not('thumbnail_path', 'is', null)
      .order('created_at', { ascending: true });

    for (const row of (variantRows ?? []) as VariantThumbnailRow[]) {
      if (!thumbnailByProjectId.has(row.project_id) && row.thumbnail_path) {
        thumbnailByProjectId.set(row.project_id, row.thumbnail_path);
      }
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">{t('title')}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="size-4" />
                {t('cta')}
              </Link>
            </Button>
          </div>
        </header>

        {projects.length === 0 ? (
          <section className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
            <Sparkles className="size-8 text-emerald-300" aria-hidden />
            <h2 className="text-2xl font-semibold">{t('empty_state')}</h2>
            <Button asChild className="mt-2">
              <Link href="/projects/new">
                <Plus className="size-4" />
                {t('cta')}
              </Link>
            </Button>
          </section>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const thumbnailPath = thumbnailByProjectId.get(project.id);
              const statusBadgeClass = STATUS_BADGE_CLASSES[project.status];
              return (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] transition hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
                      {thumbnailPath && isAbsoluteUrl(thumbnailPath) ? (
                        <Image
                          src={thumbnailPath}
                          alt={project.name ?? ''}
                          fill
                          sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div
                          className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getGradientForProjectId(project.id)}`}
                        >
                          <ImageOff className="size-8 text-white/40" aria-hidden />
                        </div>
                      )}
                      <span
                        className={`absolute right-3 top-3 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass}`}
                      >
                        {tProject(`status.${project.status}`)}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="line-clamp-2 font-medium">
                          {project.name ?? '—'}
                        </p>
                        <ArrowRight className="mt-1 size-4 shrink-0 text-neutral-500 transition group-hover:text-white" />
                      </div>
                      <p className="text-xs text-neutral-500">
                        {tProject('created_at', { date: formatCreatedAt(project.created_at, locale) })}
                      </p>
                      <div className="mt-auto flex flex-wrap gap-1.5">
                        {project.preset ? (
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-neutral-300">
                            {project.preset}
                          </span>
                        ) : null}
                        {project.platform ? (
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-neutral-300">
                            {project.platform}
                          </span>
                        ) : null}
                        {project.output_format ? (
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-neutral-300">
                            {project.output_format}
                          </span>
                        ) : null}
                        {typeof project.variants_count === 'number' ? (
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-neutral-300">
                            {tProject('variants_count', { count: project.variants_count })}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
};

export default ProjectsListPage;
