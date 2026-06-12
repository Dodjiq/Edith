'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Plus, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/new', label: 'Nouveau', icon: Plus },
  { href: '/billing', label: 'Facturation', icon: CreditCard },
];

const SidebarNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className='flex flex-col gap-1 p-3'>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== '/new' && pathname.startsWith(href));

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              isActive
                ? 'border-l-2 border-edith-accent bg-edith-accent/10 pl-[10px] text-edith-accent'
                : 'text-edith-muted hover:bg-white/5 hover:text-edith-text'
            )}
          >
            <Icon className='size-4 shrink-0' />
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export { SidebarNav };
