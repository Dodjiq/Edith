'use client';

import { UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/buttons/button';
import { createClient } from '@/utils/supabase/client';

const sanitizeFileName = (fileName: string): string => fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

const NewProjectPage: React.FC = () => {
  const router = useRouter();
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
          throw new Error('Choisis un fichier video.');
        }

        fileName = file.name;
        mimeType = file.type;
        sizeBytes = file.size;
        storagePath = `${user.id}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
        setUploadProgress('Upload vers Supabase Storage...');

        const { error: uploadError } = await supabase.storage.from('videos').upload(storagePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        });

        if (uploadError) {
          throw uploadError;
        }
      }

      setUploadProgress('Creation du job de rendu...');
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
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Impossible de lancer la generation.');
      }

      router.push(`/projects/${payload.project.id}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Erreur inconnue.');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm text-neutral-400">Nouveau projet</p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight">Transformer un rush en variantes ads</h1>
          </div>
          <p className="self-end text-sm leading-6 text-neutral-400">
            Upload direct vers Supabase Storage, creation projet en base, puis declenchement Modal si active.
            Cloudflare ne rend jamais la video.
          </p>
        </div>

        <form action={submitProject} className="grid gap-6 rounded-lg border border-white/10 bg-white/[0.04] p-6 lg:grid-cols-[0.9fr_1.1fr]">
          <label className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-neutral-900/70 p-8 text-center">
            <UploadCloud className="mb-4 size-10 text-emerald-300" />
            <span className="text-lg font-semibold">Video source</span>
            <span className="mt-2 text-sm text-neutral-400">MP4, MOV ou WebM. Stockage Supabase prive.</span>
            <input name="sourceVideo" type="file" accept="video/*" className="mt-6 w-full max-w-xs text-sm text-neutral-400 file:mr-4 file:rounded-md file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-950" />
          </label>

          <div className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm text-neutral-300">Nom du projet</span>
              <input name="projectName" required defaultValue="Test creatif produit" className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none" />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm text-neutral-300">Preset</span>
                <select name="preset" defaultValue="ugc_dynamic" className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none">
                  <option value="ugc_dynamic">UGC dynamique</option>
                  <option value="ecommerce_ad">E-commerce ad</option>
                  <option value="product_demo">Demo produit</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-neutral-300">Plateforme</span>
                <select name="platform" defaultValue="tiktok" className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none">
                  <option value="tiktok">TikTok Ads</option>
                  <option value="reels">Reels Ads</option>
                  <option value="facebook_ads">Facebook Ads</option>
                  <option value="shorts">Shorts</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-neutral-300">Format</span>
                <select name="format" defaultValue="9:16" className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none">
                  <option value="9:16">9:16 vertical</option>
                  <option value="1:1">1:1 carre</option>
                  <option value="16:9">16:9 horizontal</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-neutral-300">Variantes</span>
                <select name="variantsCount" defaultValue="3" className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none">
                  <option value="1">1 variante</option>
                  <option value="3">3 variantes</option>
                  <option value="5">5 variantes</option>
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm text-neutral-300">Langue</span>
              <select name="language" defaultValue="fr" className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none">
                <option value="fr">Francais</option>
                <option value="en">Anglais</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-neutral-300">Instructions</span>
              <textarea name="instructions" rows={5} className="w-full rounded-md border border-white/10 bg-neutral-900 px-3 py-3 text-sm outline-none" placeholder="Ex: teste un angle benefice, un angle preuve sociale et un angle urgence." />
            </label>

            {uploadProgress && <p className="text-sm text-emerald-300">{uploadProgress}</p>}
            {error && <p className="text-sm text-red-300">{error}</p>}

            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Generation...' : 'Generer les variantes'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default NewProjectPage;
