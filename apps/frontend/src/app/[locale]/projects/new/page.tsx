'use client';

import { UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/buttons/button';
import { createClient } from '@/utils/supabase/client';

const sanitizeFileName = (fileName: string): string => fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

const NewProjectPage: React.FC = () => {
  const router = useRouter();
  const t = useTranslations('projects.new');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string>('');

  const submitProject = async (formData: FormData) => {
    setIsSubmitting(true);
    setError('');
    setUploadProgress('');

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const file = formData.get('sourceVideo');
      let storagePath = 'mock/source-video.mp4';
      let fileName = 'mock-source.mp4';
      let mimeType = 'video/mp4';
      let sizeBytes = 0;

      if (user && file instanceof File && file.size > 0) {
        if (!file.type.startsWith('video/')) {
          throw new Error(t('error_video'));
        }

        fileName = file.name;
        mimeType = file.type;
        sizeBytes = file.size;
        storagePath = `${user.id}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
        setUploadProgress(t('progress_upload'));

        const { error: uploadError } = await supabase.storage.from('videos').upload(storagePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        });

        if (uploadError) {
          throw uploadError;
        }
      }

      setUploadProgress(t('progress_job'));
      const voiceoverRequested = formData.get('voiceoverRequested') === 'true';
      const advancedModeRequested = formData.get('advancedModeRequested') === 'true';
      const response = await fetch('/api/render/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: formData.get('projectName'),
          preset: formData.get('preset'),
          platform: formData.get('platform'),
          format: formData.get('format'),
          variantsCount: Number(formData.get('variantsCount')),
          language: formData.get('language'),
          instructions: formData.get('instructions'),
          storagePath,
          fileName,
          mimeType,
          sizeBytes,
          voiceoverRequested,
          advancedModeRequested,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? t('error_generic'));
      }

      router.push(`/projects/${payload.project.id}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t('error_unknown'));
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm text-neutral-400">{t('label')}</p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight">{t('title')}</h1>
          </div>
          <p className="self-end text-sm leading-6 text-neutral-400">
            {t('subtitle')}
          </p>
        </div>

        <form action={submitProject} className="grid gap-6 rounded-lg border border-white/10 bg-white/[0.04] p-6 lg:grid-cols-[0.9fr_1.1fr]">
          <input type="hidden" name="voiceoverRequested" value="false" />
          <input type="hidden" name="advancedModeRequested" value="false" />
          <label className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-neutral-900/70 p-8 text-center">
            <UploadCloud className="mb-4 size-10 text-emerald-300" />
            <span className="text-lg font-semibold">{t('upload.title')}</span>
            <span className="mt-2 text-sm text-neutral-400">{t('upload.hint')}</span>
            <input name="sourceVideo" type="file" accept="video/*" className="mt-6 w-full max-w-xs text-sm text-neutral-400 file:mr-4 file:rounded-md file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-950" />
          </label>

          <div className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm text-neutral-300">{t('project_name')}</span>
              <input name="projectName" required defaultValue={t('project_name_default')} className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none" />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm text-neutral-300">{t('preset')}</span>
                <select name="preset" defaultValue="ugc_dynamic" className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none">
                  <option value="ugc_dynamic">{t('preset_options.ugc')}</option>
                  <option value="ecommerce_ad">{t('preset_options.ecommerce')}</option>
                  <option value="product_demo">{t('preset_options.demo')}</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-neutral-300">{t('platform')}</span>
                <select name="platform" defaultValue="tiktok" className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none">
                  <option value="tiktok">{t('platform_options.tiktok')}</option>
                  <option value="reels">{t('platform_options.reels')}</option>
                  <option value="facebook_ads">{t('platform_options.facebook')}</option>
                  <option value="shorts">{t('platform_options.shorts')}</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-neutral-300">{t('format')}</span>
                <select name="format" defaultValue="9:16" className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none">
                  <option value="9:16">{t('format_options.vertical')}</option>
                  <option value="1:1">{t('format_options.square')}</option>
                  <option value="16:9">{t('format_options.horizontal')}</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-neutral-300">{t('variants')}</span>
                <select name="variantsCount" defaultValue="3" className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none">
                  <option value="1">{t('variants_options.one')}</option>
                  <option value="3">{t('variants_options.three')}</option>
                  <option value="5">{t('variants_options.five')}</option>
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm text-neutral-300">{t('language')}</span>
              <select name="language" defaultValue="fr" className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none">
                <option value="fr">{t('language_options.fr')}</option>
                <option value="en">{t('language_options.en')}</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-neutral-300">{t('instructions')}</span>
              <textarea name="instructions" rows={5} className="w-full rounded-md border border-white/10 bg-neutral-900 px-3 py-3 text-sm outline-none" placeholder={t('instructions_placeholder')} />
            </label>

            {uploadProgress && <p className="text-sm text-emerald-300">{uploadProgress}</p>}
            {error && <p className="text-sm text-red-300">{error}</p>}

            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? t('submitting') : t('submit')}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default NewProjectPage;
