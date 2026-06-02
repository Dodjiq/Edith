'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/buttons/button';

const NewProjectPage: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const submitProject = async (formData: FormData) => {
    setIsSubmitting(true);
    setError('');

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
        storagePath: 'mock/source-video.mp4',
      }),
    });

    const payload = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setError(payload.error ?? 'Impossible de lancer la génération.');
      return;
    }

    router.push(`/projects/${payload.project.id}`);
  };

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm text-neutral-400">Nouveau projet</p>
          <h1 className="text-3xl font-semibold">Générer des variantes ads</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Le formulaire simule l'upload et lance un rendu mock. Supabase Storage sera branché ensuite.
          </p>
        </div>

        <form action={submitProject} className="space-y-5 rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <label className="block space-y-2">
            <span className="text-sm text-neutral-300">Nom du projet</span>
            <input name="projectName" required defaultValue="Test créatif produit" className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none" />
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
                <option value="1:1">1:1 carré</option>
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
              <option value="fr">Français</option>
              <option value="en">Anglais</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-neutral-300">Instructions</span>
            <textarea name="instructions" rows={5} className="w-full rounded-md border border-white/10 bg-neutral-900 px-3 py-3 text-sm outline-none" placeholder="Ex: fais 3 variantes pour tester un angle bénéfice, un angle preuve sociale et un angle urgence." />
          </label>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Génération...' : 'Générer'}
          </Button>
        </form>
      </div>
    </main>
  );
};

export default NewProjectPage;
