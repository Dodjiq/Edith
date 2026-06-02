import { NextResponse } from 'next/server';
import { getMockProjectSnapshot } from '@/lib/mvp/mock-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  const snapshot = getMockProjectSnapshot(projectId);

  if (!snapshot) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(snapshot);
}
