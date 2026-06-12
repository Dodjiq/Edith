import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import type { Profile } from '@/types/database';

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_name')
    .eq('user_id', user!.id)
    .single<Pick<Profile, 'shop_name'>>();

  const shopName = profile?.shop_name ?? user!.email ?? 'Mon espace';

  return (
    <div className='flex min-h-screen bg-edith-bg text-edith-text'>
      <aside className='flex w-60 shrink-0 flex-col border-r border-white/8 bg-edith-bg2'>
        <div className='flex h-14 items-center border-b border-white/8 px-5'>
          <span className='text-sm font-semibold text-edith-accent'>Edith</span>
        </div>
        <SidebarNav />
      </aside>

      <div className='flex min-w-0 flex-1 flex-col'>
        <header className='flex h-14 items-center border-b border-white/8 px-6'>
          <span className='text-sm text-edith-muted'>{shopName}</span>
        </header>
        <main className='flex-1 p-6'>{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
