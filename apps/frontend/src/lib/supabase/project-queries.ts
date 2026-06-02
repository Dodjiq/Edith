import { createClient } from '@/utils/supabase/server';

export const getCurrentUser = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
};

export const listProjectsForCurrentUser = async () => {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { user: null, projects: [], credits: null };
  }

  const [{ data: projects }, { data: credits }] = await Promise.all([
    supabase
      .from('projects')
      .select('id,name,status,preset,platform,output_format,variants_count,created_at,updated_at')
      .order('created_at', { ascending: false }),
    supabase.from('user_credits').select('balance,reserved,monthly_allowance').eq('user_id', user.id).maybeSingle(),
  ]);

  return {
    user,
    projects: projects ?? [],
    credits,
  };
};

export const getProjectSnapshotForCurrentUser = async (projectId: string) => {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { user: null, project: null, variants: [], jobs: [] };
  }

  const [{ data: project }, { data: variants }, { data: jobs }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).eq('user_id', user.id).maybeSingle(),
    supabase.from('video_variants').select('*').eq('project_id', projectId).eq('user_id', user.id).order('created_at'),
    supabase.from('render_jobs').select('*').eq('project_id', projectId).eq('user_id', user.id).order('created_at', { ascending: false }),
  ]);

  return {
    user,
    project,
    variants: variants ?? [],
    jobs: jobs ?? [],
  };
};
