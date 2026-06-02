import type { EditPlan, EdithFormat, EdithLanguage, EdithPlatform, EdithPreset } from '@/lib/edit-plan/generate-edit-plan';

export type MockProjectStatus =
  | 'draft'
  | 'uploaded'
  | 'queued'
  | 'transcribing'
  | 'planning'
  | 'rendering'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type MockProject = {
  id: string;
  userId: string;
  name: string;
  status: MockProjectStatus;
  preset: EdithPreset;
  platform: EdithPlatform;
  outputFormat: EdithFormat;
  language: EdithLanguage;
  instructions: string;
  variantsCount: number;
  createdAt: string;
};

export type MockVariant = {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  marketingAngle: string;
  hookText: string;
  status: 'queued' | 'rendering' | 'completed' | 'failed' | 'cancelled';
  exportUrl: string | null;
  editPlan: EditPlan['variants'][number];
  createdAt: string;
};

export type MockRenderJob = {
  id: string;
  projectId: string;
  userId: string;
  status: MockProjectStatus;
  modalJobId: string;
  createdAt: string;
};

type MockDb = {
  projects: Map<string, MockProject>;
  variants: Map<string, MockVariant>;
  jobs: Map<string, MockRenderJob>;
};

const getDb = (): MockDb => {
  const globalState = globalThis as typeof globalThis & { __edithMockDb?: MockDb };

  if (!globalState.__edithMockDb) {
    globalState.__edithMockDb = {
      projects: new Map(),
      variants: new Map(),
      jobs: new Map(),
    };
  }

  return globalState.__edithMockDb;
};

export const mockUserId = 'mock-user-edith';

export const upsertMockProject = (
  input: Omit<MockProject, 'id' | 'userId' | 'status' | 'createdAt'> & { id?: string },
): MockProject => {
  const db = getDb();
  const now = new Date().toISOString();
  const project: MockProject = {
    id: input.id ?? crypto.randomUUID(),
    userId: mockUserId,
    status: 'queued',
    createdAt: now,
    ...input,
  };

  db.projects.set(project.id, project);
  return project;
};

export const completeMockRender = ({
  project,
  editPlan,
}: {
  project: MockProject;
  editPlan: EditPlan;
}): { job: MockRenderJob; variants: MockVariant[] } => {
  const db = getDb();
  const now = new Date().toISOString();
  const job: MockRenderJob = {
    id: crypto.randomUUID(),
    projectId: project.id,
    userId: project.userId,
    status: 'completed',
    modalJobId: `mock-modal-${crypto.randomUUID()}`,
    createdAt: now,
  };
  const variants = editPlan.variants.map((variant) => {
    const record: MockVariant = {
      id: crypto.randomUUID(),
      projectId: project.id,
      userId: project.userId,
      name: variant.name,
      marketingAngle: variant.marketingAngle,
      hookText: variant.hookText,
      status: 'completed',
      exportUrl: '/placeholder-video.mp4',
      editPlan: variant,
      createdAt: now,
    };
    db.variants.set(record.id, record);
    return record;
  });

  db.jobs.set(job.id, job);
  db.projects.set(project.id, { ...project, status: 'completed' });

  return { job, variants };
};

export const getMockProjectSnapshot = (projectId: string) => {
  const db = getDb();
  const project = db.projects.get(projectId);

  if (!project) {
    return null;
  }

  return {
    project,
    variants: Array.from(db.variants.values()).filter((variant) => variant.projectId === projectId),
    jobs: Array.from(db.jobs.values()).filter((job) => job.projectId === projectId),
  };
};

export const listMockProjects = (): MockProject[] => {
  return Array.from(getDb().projects.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};
