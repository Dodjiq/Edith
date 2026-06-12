'use client';

import Link from 'next/link';
import { Film } from 'lucide-react';
import { Button } from '@/components/buttons/button';

const EmptyProjects: React.FC = () => {
  return (
    <div className='flex min-h-[40vh] flex-col items-center justify-center gap-5 rounded-xl border border-dashed border-white/12 p-10 text-center'>
      <div className='flex size-14 items-center justify-center rounded-full bg-edith-accent/10 text-edith-accent'>
        <Film className='size-6' />
      </div>
      <div className='space-y-1'>
        <p className='text-base font-medium text-edith-text'>Votre premier projet vous attend</p>
        <p className='text-sm text-edith-muted'>
          Importez une vidéo et laissez Edith créer vos créas publicitaires.
        </p>
      </div>
      <Button asChild className='bg-edith-accent text-edith-bg hover:bg-edith-accent/90'>
        <Link href='/new'>Créer un projet</Link>
      </Button>
    </div>
  );
};

export { EmptyProjects };
