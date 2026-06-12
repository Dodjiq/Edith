import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { ProjectsGrid } from '@/components/dashboard/projects-grid';
import { EmptyProjects } from '@/components/dashboard/empty-projects';
import { CreditsBadge } from '@/components/dashboard/credits-badge';
import { Button } from '@/components/buttons/button';
import type { Project, UserCredits } from '@/types/database';
import { Plus } from 'lucide-react';

const DashboardPage = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ data: projects }, { data: credits }] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false })
      .returns<Project[]>(),
    supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user!.id)
      .single<UserCredits>(),
  ]);

  const projectList = projects ?? [];

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold text-edith-text'>Mes projets</h1>
        <Button asChild className='bg-edith-accent text-edith-bg hover:bg-edith-accent/90'>
          <Link href='/new'>
            <Plus className='size-4' />
            Nouveau projet
          </Link>
        </Button>
      </div>

      {credits && (
        <CreditsBadge
          used={credits.monthly_exports_used}
          allowance={credits.monthly_allowance}
          plan='free'
        />
      )}

      {projectList.length === 0 ? (
        <EmptyProjects />
      ) : (
        <ProjectsGrid projects={projectList} />
      )}
    </div>
  );
};

export default DashboardPage;
