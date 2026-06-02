import { NextResponse } from 'next/server';
import { getMockProjectSnapshot } from '@/lib/mvp/mock-store';
import { getProjectSnapshotForCurrentUser } from '@/lib/supabase/project-queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  const realSnapshot = await getProjectSnapshotForCurrentUser(projectId);

  if (realSnapshot.user && realSnapshot.project) {
    return NextResponse.json({
      project: realSnapshot.project,
      variants: realSnapshot.variants.map((variant) => ({
        ...variant,
        exportUrl: variant.export_path ? `/api/render/download?path=${encodeURIComponent(variant.export_path)}` : null,
      })),
      jobs: realSnapshot.jobs,
      mode: 'supabase',
    });
  }

  const snapshot = getMockProjectSnapshot(projectId);

  if (!snapshot) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(snapshot);
}
