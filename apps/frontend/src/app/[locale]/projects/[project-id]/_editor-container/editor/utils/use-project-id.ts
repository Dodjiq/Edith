'use client';

import { useParams } from 'next/navigation';

export const useProjectId = (): string => {
  const params = useParams();
  const rawProjectId = params?.['project-id'];
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

  if (!projectId || typeof projectId !== 'string') {
    throw new Error('Project ID is missing from route params');
  }

  return projectId;
};

