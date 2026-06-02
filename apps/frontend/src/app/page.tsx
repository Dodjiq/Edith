import Link from 'next/link';
import { Plus, Film } from 'lucide-react';
import { Button } from '@/components/buttons/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/cards/card';
import Image from 'next/image';

const Home: React.FC = () => {
  const projects: Array<{ id: string; title: string; thumbnail: string; updatedAt: string }> = [];

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-16 flex flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Edith</h1>
          <p className="max-w-md text-zinc-500 dark:text-zinc-400">
            Edit videos with natural language. Remove silences, add subtitles, and more.
          </p>
          <Button asChild size="lg" className="mt-4">
            <Link href="/projects/1">
              <Plus className="size-4" />
              Create Project
            </Link>
          </Button>
        </header>

        <section>
          <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Recent Projects
          </h2>

          {projects.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="group cursor-pointer pt-0 transition-shadow hover:shadow-md">
                    <CardContent className="relative aspect-video w-full overflow-hidden rounded-t-xl px-0">
                      <Image src={project.thumbnail} alt={project.title} fill className="object-cover" />
                    </CardContent>
                    <CardHeader className="pt-0">
                      <CardTitle className="group-hover:text-primary text-base">{project.title}</CardTitle>
                      <CardDescription>{project.updatedAt}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 py-16 dark:border-zinc-800">
              <Film className="mb-3 size-8 text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No projects yet</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Home;
