'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/buttons/button';

type Variant = {
  id: string;
  name: string;
  marketingAngle: string;
  hookText: string;
  status: string;
  exportUrl: string | null;
};

type ProjectSnapshot = {
  project: {
    id: string;
    name: string;
    status: string;
    preset: string;
    outputFormat: string;
    variantsCount: number;
  };
  variants: Variant[];
};

const ProjectDetailPage: React.FC = () => {
  const params = useParams<{ 'project-id': string }>();
  const projectId = params['project-id'];
  const [snapshot, setSnapshot] = useState<ProjectSnapshot | null>(null);

  useEffect(() => {
    fetch(`/api/render/status?projectId=${projectId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => setSnapshot(payload))
      .catch(() => setSnapshot(null));
  }, [projectId]);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link href="/dashboard" className="text-sm text-neutral-400">
              Dashboard
            </Link>
            <h1 className="mt-2 text-3xl font-semibold">{snapshot?.project.name ?? 'Projet Edith'}</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Statut: <span className="text-emerald-300">{snapshot?.project.status ?? 'mock indisponible après reload'}</span>
            </p>
          </div>
          <Button asChild>
            <Link href="/projects/new">Nouveau projet</Link>
          </Button>
        </header>

        {!snapshot ? (
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-8">
            <h2 className="text-xl font-semibold">Aucun statut persistant trouvé</h2>
            <p className="mt-2 text-sm text-neutral-400">
              Le mode mock stocke les projets en mémoire serveur. Après un reload ou un nouveau déploiement,
              branche Supabase pour persister les résultats.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-3">
            {snapshot.variants.map((variant) => (
              <article key={variant.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-4 aspect-[9/16] rounded-md bg-neutral-900 p-4">
                  <div className="flex h-full items-center justify-center rounded border border-white/10 text-center text-sm text-neutral-400">
                    Preview mock
                  </div>
                </div>
                <p className="text-sm text-emerald-300">{variant.status}</p>
                <h2 className="mt-1 font-semibold">{variant.name}</h2>
                <p className="mt-2 text-sm text-neutral-400">{variant.marketingAngle}</p>
                <p className="mt-3 rounded-md bg-neutral-900 p-3 text-sm">{variant.hookText}</p>
                <Button asChild className="mt-4 w-full" variant="outline">
                  <a href={variant.exportUrl ?? '#'}>Télécharger</a>
                </Button>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
};

export default ProjectDetailPage;
