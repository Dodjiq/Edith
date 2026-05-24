'use client';

import React, { useState } from 'react';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Button } from '@/components/buttons/button';
import { FolderOpen } from 'lucide-react';

const ProjectsPage = () => {
  const [projects, setProjects] = useState<any[]>([]);

  if (projects.length === 0) {
    return (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpen className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No projects found</EmptyTitle>
            <EmptyDescription>Create a new project to get started.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => console.log('Create project')}>Create Project</Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return <div>Projects history</div>;
};

export default ProjectsPage;
