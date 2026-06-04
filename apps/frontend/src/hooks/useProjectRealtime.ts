'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

export type ProjectStatus =
  | 'draft'
  | 'uploaded'
  | 'queued'
  | 'transcribing'
  | 'planning'
  | 'rendering'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface RealtimeProject {
  id: string;
  status: ProjectStatus;
  error_message: string | null;
}

export type RealtimeConnectionStatus = 'connecting' | 'connected' | 'offline';

interface UseProjectRealtimeResult {
  projects: ReadonlyArray<RealtimeProject>;
  connectionStatus: RealtimeConnectionStatus;
}

// Type guard so we can safely treat the realtime row payload as RealtimeProject.
const isRealtimeProjectRow = (value: unknown): value is RealtimeProject => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'string' && typeof candidate.status === 'string';
};

// Subscribes to INSERT/UPDATE on `public.projects` for the current user and exposes a
// live-updated copy of the initial project list along with the realtime connection status.
export const useProjectRealtime = (
  userId: string,
  initialProjects: ReadonlyArray<RealtimeProject>,
  onChange?: () => void,
): UseProjectRealtimeResult => {
  const [projects, setProjects] = useState<ReadonlyArray<RealtimeProject>>(initialProjects);
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>('connecting');
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const supabase = createClient();

    const handleUpdate = (payload: RealtimePostgresChangesPayload<RealtimeProject>): void => {
      const next = payload.new;
      if (!isRealtimeProjectRow(next)) return;
      setProjects((prev) => prev.map((project) => (project.id === next.id ? { ...project, ...next } : project)));
      onChangeRef.current?.();
    };

    const handleInsert = (payload: RealtimePostgresChangesPayload<RealtimeProject>): void => {
      const next = payload.new;
      if (!isRealtimeProjectRow(next)) return;
      setProjects((prev) => (prev.some((project) => project.id === next.id) ? prev : [next, ...prev]));
      onChangeRef.current?.();
    };

    const channel: RealtimeChannel = supabase
      .channel(`projects-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'projects', filter: `user_id=eq.${userId}` },
        handleUpdate,
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'projects', filter: `user_id=eq.${userId}` },
        handleInsert,
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('offline');
        } else {
          setConnectionStatus('connecting');
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return { projects, connectionStatus };
};
