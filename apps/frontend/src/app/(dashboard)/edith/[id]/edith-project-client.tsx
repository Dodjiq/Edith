'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, Download, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

type Variant = {
  id: string;
  name: string;
  status: string;
  export_path: string | null;
  created_at: string;
};

type Project = {
  id: string;
  name: string;
  status: string;
  platform: string;
  output_format: string;
  preset: string;
  variants_count: number;
};

interface EdithProjectClientProps {
  project: Project;
  initialVariants: Variant[];
}

const TERMINAL_STATUSES = new Set(['completed', 'error', 'failed']);

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  queued: 'En attente',
  planning: 'Planification IA...',
  rendering: 'Rendu en cours...',
  completed: 'Terminé',
  error: 'Erreur',
  failed: 'Échoué',
};

const VariantStatusIcon: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'completed') return <CheckCircle2 className='h-5 w-5 text-[#30f4d2]' />;
  if (status === 'error' || status === 'failed') return <XCircle className='h-5 w-5 text-red-400' />;
  if (status === 'rendering') return <Loader2 className='h-5 w-5 animate-spin text-[#30f4d2]' />;
  return <Clock className='h-5 w-5 text-[#8b9d99]' />;
};

export const EdithProjectClient: React.FC<EdithProjectClientProps> = ({
  project,
  initialVariants,
}) => {
  const [variants, setVariants] = useState<Variant[]>(initialVariants);
  const [projectStatus, setProjectStatus] = useState(project.status);

  const isTerminal = TERMINAL_STATUSES.has(projectStatus);

  useEffect(() => {
    if (isTerminal && variants.every((v) => TERMINAL_STATUSES.has(v.status))) return;

    const supabase = createClient();
    let timer: ReturnType<typeof setInterval>;

    const poll = async () => {
      const { data: updatedProject } = await supabase
        .from('projects')
        .select('status')
        .eq('id', project.id)
        .single();

      if (updatedProject) setProjectStatus(updatedProject.status);

      const { data: updatedVariants } = await supabase
        .from('video_variants')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });

      if (updatedVariants) setVariants(updatedVariants);
    };

    timer = setInterval(poll, 4000);
    return () => clearInterval(timer);
  }, [project.id, isTerminal, variants]);

  const completedCount = variants.filter((v) => v.status === 'completed').length;
  const totalExpected = project.variants_count;

  return (
    <div className='min-h-screen bg-[#020504] px-6 py-10'>
      <div className='mx-auto max-w-4xl'>
        <Link
          href='/dashboard'
          className='mb-6 flex items-center gap-2 text-sm text-[#8b9d99] transition-colors hover:text-[#f3fffc]'
        >
          <ArrowLeft className='h-4 w-4' />
          Retour au dashboard
        </Link>

        <div className='mb-8'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h1 className='text-2xl font-bold text-[#f3fffc]'>{project.name}</h1>
              <div className='mt-1 flex items-center gap-3'>
                <span className='text-sm text-[#8b9d99]'>{project.platform}</span>
                <span className='text-[#8b9d99]'>·</span>
                <span className='text-sm text-[#8b9d99]'>{project.output_format}</span>
              </div>
            </div>
            <StatusBadge status={projectStatus} />
          </div>

          {!isTerminal && (
            <div className='mt-4 overflow-hidden rounded-full bg-white/[0.06]'>
              <motion.div
                className='h-1.5 rounded-full bg-[#30f4d2]'
                initial={{ width: '5%' }}
                animate={{ width: `${completedCount === 0 ? 5 : Math.round((completedCount / totalExpected) * 100)}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          )}
        </div>

        {variants.length === 0 && !isTerminal && (
          <div className='flex flex-col items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] py-16 text-center'>
            <Loader2 className='h-8 w-8 animate-spin text-[#30f4d2]' />
            <p className='text-sm text-[#8b9d99]'>
              {STATUS_LABELS[projectStatus] ?? 'Initialisation du pipeline IA...'}
            </p>
          </div>
        )}

        {variants.length > 0 && (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {variants.map((variant, i) => (
              <motion.div
                key={variant.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className='group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] p-5'
              >
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-semibold text-[#f3fffc]'>{variant.name}</span>
                  <VariantStatusIcon status={variant.status} />
                </div>

                <div className='text-xs text-[#8b9d99]'>
                  {STATUS_LABELS[variant.status] ?? variant.status}
                </div>

                {variant.status === 'completed' && variant.export_path && (
                  <a
                    href={variant.export_path}
                    download
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center justify-center gap-2 rounded-lg bg-[#30f4d2]/10 px-4 py-2.5 text-sm font-medium text-[#30f4d2] transition-colors hover:bg-[#30f4d2]/20'
                  >
                    <Download className='h-4 w-4' />
                    Télécharger
                  </a>
                )}

                {variant.status === 'rendering' && (
                  <div className='overflow-hidden rounded-full bg-white/[0.06]'>
                    <motion.div
                      className='h-1 rounded-full bg-[#30f4d2]'
                      animate={{ width: ['10%', '90%'] }}
                      transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {isTerminal && completedCount > 0 && (
          <div className='mt-8 rounded-2xl border border-[#30f4d2]/20 bg-[#30f4d2]/5 p-5 text-center'>
            <p className='text-sm text-[#30f4d2]'>
              {completedCount} variante{completedCount > 1 ? 's' : ''} prête{completedCount > 1 ? 's' : ''} au téléchargement
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const isActive = !TERMINAL_STATUSES.has(status);
  return (
    <span
      className={[
        'rounded-full px-3 py-1 text-xs font-medium',
        status === 'completed'
          ? 'bg-[#30f4d2]/10 text-[#30f4d2]'
          : status === 'error' || status === 'failed'
            ? 'bg-red-500/10 text-red-400'
            : 'bg-white/8 text-[#8b9d99]',
      ].join(' ')}
    >
      {isActive && <span className='mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current' />}
      {STATUS_LABELS[status] ?? status}
    </span>
  );
};
