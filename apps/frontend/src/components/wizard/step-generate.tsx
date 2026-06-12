'use client';

import { useRouter } from 'next/navigation';
import { Minus, Plus, Loader2 } from 'lucide-react';
import { useWizardStore } from '@/store/wizard-store';
import { createClient } from '@/utils/supabase/client';
import { directS3Upload } from '@/app/projects/[project-id]/_editor-container/editor/utils/upload';
import { getBackendUrl } from '@/utils/services/backend-url';

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram Reels',
  meta: 'Meta Ads',
  youtube: 'YouTube Shorts',
};

const PRESET_LABELS: Record<string, string> = {
  ugc_dynamic: 'UGC Dynamique',
  premium: 'Premium',
  agressif: 'Agressif',
  storytelling: 'Storytelling',
  avant_apres: 'Avant/Après',
};

const getVideoDuration = (file: File): Promise<number> =>
  new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(isFinite(video.duration) ? video.duration : 0);
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });

export const StepGenerate: React.FC = () => {
  const router = useRouter();
  const store = useWizardStore();
  const {
    variantsCount,
    platform,
    outputFormat,
    preset,
    projectName,
    language,
    instructions,
    isSubmitting,
    files,
    setField,
    setIsSubmitting,
  } = store;

  const decrementVariants = () => setField('variantsCount', Math.max(1, variantsCount - 1));
  const incrementVariants = () => setField('variantsCount', Math.min(5, variantsCount + 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: projectName || 'Nouveau projet',
          platform,
          output_format: outputFormat,
          preset,
          language,
          instructions,
          variants_count: variantsCount,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      for (const file of files) {
        const duration = await getVideoDuration(file);

        const { fileKey } = await directS3Upload({
          file,
          filename: file.name,
          assetId: crypto.randomUUID(),
          contentType: file.type,
          needsTranscription: false,
          needsVideoAnalysis: false,
          projectId: project.id,
        });

        await supabase.from('project_assets').insert({
          project_id: project.id,
          user_id: user.id,
          kind: 'source_video',
          file_name: file.name,
          mime_type: file.type,
          storage_path: fileKey,
          status: 'uploaded',
          size_bytes: file.size,
          duration_seconds: duration > 0 ? Math.round(duration) : null,
        });
      }

      await fetch(`${getBackendUrl()}/edith/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, userId: user.id }),
      });

      store.reset();
      router.push(`/edith/${project.id}`);
    } catch (err) {
      console.debug('Erreur création projet:', err);
      setIsSubmitting(false);
    }
  };

  const summaryItems = [
    { label: 'Plateforme', value: PLATFORM_LABELS[platform] ?? platform },
    { label: 'Format', value: outputFormat },
    { label: 'Preset', value: PRESET_LABELS[preset] ?? preset },
    ...(files.length > 0
      ? [{ label: 'Vidéos', value: `${files.length} fichier${files.length > 1 ? 's' : ''}` }]
      : []),
  ];

  return (
    <div className='space-y-6'>
      <div className='rounded-xl border border-white/10 bg-white/5 p-4'>
        <h3 className='mb-3 text-sm font-medium text-[#8b9d99]'>Récapitulatif</h3>
        <dl className='space-y-2'>
          {summaryItems.map((item) => (
            <div key={item.label} className='flex items-center justify-between'>
              <dt className='text-sm text-[#8b9d99]'>{item.label}</dt>
              <dd className='text-sm font-medium text-[#f3fffc]'>{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className='space-y-3'>
        <label className='text-sm font-medium text-[#f3fffc]'>Nombre de variantes</label>
        <div className='flex items-center gap-4'>
          <button
            onClick={decrementVariants}
            disabled={variantsCount <= 1}
            className='flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#f3fffc] transition-colors hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-40'
          >
            <Minus className='h-4 w-4' />
          </button>
          <span className='w-8 text-center text-2xl font-bold text-[#30f4d2]'>{variantsCount}</span>
          <button
            onClick={incrementVariants}
            disabled={variantsCount >= 5}
            className='flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#f3fffc] transition-colors hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-40'
          >
            <Plus className='h-4 w-4' />
          </button>
          <span className='text-sm text-[#8b9d99]'>
            {variantsCount} version{variantsCount > 1 ? 's' : ''} générée{variantsCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || files.length === 0}
        className='flex w-full items-center justify-center gap-2 rounded-xl bg-[#30f4d2] px-6 py-4 text-base font-semibold text-[#020504] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
      >
        {isSubmitting ? (
          <>
            <Loader2 className='h-5 w-5 animate-spin' />
            {files.length > 0 ? 'Envoi des vidéos...' : 'Création en cours...'}
          </>
        ) : (
          'Lancer la génération'
        )}
      </button>

      {files.length === 0 && (
        <p className='text-center text-xs text-[#8b9d99]'>
          Ajoutez au moins une vidéo à l&apos;étape précédente pour continuer.
        </p>
      )}
    </div>
  );
};
