'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { Project, ProjectStatus } from '@/types/database';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Brouillon',
  uploaded: 'Uploadé',
  queued: 'En attente',
  transcribing: 'Transcription',
  planning: 'Planification',
  rendering: 'Rendu',
  completed: 'Terminé',
  failed: 'Erreur',
  cancelled: 'Annulé',
};

const STATUS_CLASSES: Record<ProjectStatus, string> = {
  completed: 'bg-edith-accent/15 text-edith-accent',
  rendering: 'bg-amber-500/15 text-amber-400',
  planning: 'bg-amber-500/15 text-amber-400',
  transcribing: 'bg-amber-500/15 text-amber-400',
  queued: 'bg-amber-500/15 text-amber-400',
  uploaded: 'bg-blue-500/15 text-blue-400',
  failed: 'bg-red-500/15 text-red-400',
  cancelled: 'bg-white/10 text-edith-muted',
  draft: 'bg-white/10 text-edith-muted',
};

const formatRelativeDate = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Il y a ${days} j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

type ProjectCardProps = {
  project: Project;
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <motion.div whileHover={{ y: -2, scale: 1.01 }} transition={{ duration: 0.15 }}>
      <Link
        href={`/projects/${project.id}`}
        className='flex flex-col gap-3 rounded-xl border border-white/8 bg-edith-bg2 p-5 transition-colors hover:border-white/15'
      >
        <div className='flex items-start justify-between gap-2'>
          <span className='line-clamp-2 text-sm font-medium text-edith-text'>{project.name}</span>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
              STATUS_CLASSES[project.status]
            )}
          >
            {STATUS_LABELS[project.status]}
          </span>
        </div>

        <div className='flex items-center gap-3 text-xs text-edith-muted'>
          {project.platform && (
            <span className='rounded border border-white/8 px-1.5 py-0.5'>{project.platform}</span>
          )}
          {project.output_format && (
            <span className='rounded border border-white/8 px-1.5 py-0.5'>
              {project.output_format}
            </span>
          )}
        </div>

        <p className='text-xs text-edith-muted'>{formatRelativeDate(project.updated_at)}</p>
      </Link>
    </motion.div>
  );
};

export { ProjectCard };
