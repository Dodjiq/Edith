'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/buttons/button';

type Variant = {
  id: string;
  name: string;
  marketingAngle?: string;
  marketing_angle?: string | null;
  hookText?: string;
  hook_text?: string | null;
  status: string;
  exportUrl: string | null;
};

type ProjectSnapshot = {
  project: {
    id: string;
    name: string;
    status: string;
    preset: string;
    outputFormat?: string;
    output_format?: string;
    variantsCount?: number;
    variants_count?: number;
  };
  variants: Variant[];
  mode?: string;
};

const ProjectDetailPage: React.FC = () => {
  const params = useParams<{ 'project-id': string }>();
  const projectId = params['project-id'];
  const [snapshot, setSnapshot] = useState<ProjectSnapshot | null>(null);

  useEffect(() => {
    const loadSnapshot = () => {
      fetch(`/api/render/status?projectId=${projectId}`)
        .then((response) => (response.ok ? response.json() : null))
        .then((payload) => setSnapshot(payload))
        .catch(() => setSnapshot(null));
    };

    loadSnapshot();
    const interval = window.setInterval(loadSnapshot, 5000);
    return () => window.clearInterval(interval);
  }, [projectId]);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col justify-between gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <Link href="/dashboard" className="text-sm text-neutral-400">
              Dashboard
            </Link>
            <h1 className="mt-2 text-3xl font-semibold">{snapshot?.project.name ?? 'Projet Edith'}</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Statut: <span className="text-emerald-300">{snapshot?.project.status ?? 'en attente de donnees'}</span>
              {snapshot?.mode ? <span className="ml-2 text-neutral-500">({snapshot.mode})</span> : null}
            </p>
          </div>
          <Button asChild>
            <Link href="/projects/new">Nouveau projet</Link>
          </Button>
        </header>

        {!snapshot ? (
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-8">
            <h2 className="text-xl font-semibold">Aucun statut trouve</h2>
            <p className="mt-2 text-sm text-neutral-400">
              Connecte-toi ou relance un projet. En mode reel, les statuts viennent de Supabase.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-3">
            {snapshot.variants.map((variant) => {
              const marketingAngle = variant.marketingAngle ?? variant.marketing_angle ?? 'Angle marketing';
              const hookText = variant.hookText ?? variant.hook_text ?? 'Hook en cours de generation';

              return (
                <article key={variant.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                  <div className="mb-4 aspect-[9/16] rounded-md bg-neutral-900 p-4">
                    <div className="flex h-full items-center justify-center rounded border border-white/10 text-center text-sm text-neutral-400">
                      Preview export
                    </div>
                  </div>
                  <p className="text-sm text-emerald-300">{variant.status}</p>
                  <h2 className="mt-1 font-semibold">{variant.name}</h2>
                  <p className="mt-2 text-sm text-neutral-400">{marketingAngle}</p>
                  <p className="mt-3 rounded-md bg-neutral-900 p-3 text-sm">{hookText}</p>
                  {variant.exportUrl ? (
                    <Button asChild className="mt-4 w-full" variant="outline">
                      <a href={variant.exportUrl}>Telecharger</a>
                    </Button>
                  ) : (
                    <div className="mt-4 rounded-md border border-white/10 px-3 py-2 text-center text-sm text-neutral-500">
                      Export en cours
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
};

export default ProjectDetailPage;
