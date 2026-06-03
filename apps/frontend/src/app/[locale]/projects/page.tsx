'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Button } from '@/components/buttons/button';
import { FolderOpen } from 'lucide-react';

const ProjectsPage = () => {
  const t = useTranslations('projects.list');
  const [projects] = useState<unknown[]>([]);

  if (projects.length === 0) {
    return (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpen className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>{t('empty_title')}</EmptyTitle>
            <EmptyDescription>{t('empty_description')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => console.log('Create project')}>{t('create_button')}</Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return <div>{t('history_label')}</div>;
};

export default ProjectsPage;
