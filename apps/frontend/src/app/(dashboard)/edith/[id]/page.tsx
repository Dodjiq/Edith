import { createServerClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { EdithProjectClient } from './edith-project-client';

interface EdithProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EdithProjectPage({ params }: EdithProjectPageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!project) redirect('/dashboard');

  const { data: variants } = await supabase
    .from('video_variants')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: true });

  return <EdithProjectClient project={project} initialVariants={variants ?? []} />;
}
