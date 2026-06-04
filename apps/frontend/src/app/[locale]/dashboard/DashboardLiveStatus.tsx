'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  useProjectRealtime,
  type RealtimeProject,
  type RealtimeConnectionStatus,
} from '@/hooks/useProjectRealtime';

interface DashboardLiveStatusProps {
  userId: string;
  projects: ReadonlyArray<RealtimeProject>;
  labels: {
    live: string;
    connecting: string;
    offline: string;
  };
}

const REFRESH_DEBOUNCE_MS = 800;

const DOT_CLASSES: Record<RealtimeConnectionStatus, string> = {
  connected: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]',
  connecting: 'bg-amber-300 animate-pulse',
  offline: 'bg-neutral-500',
};

const TEXT_CLASSES: Record<RealtimeConnectionStatus, string> = {
  connected: 'text-emerald-200',
  connecting: 'text-amber-200',
  offline: 'text-neutral-400',
};

export const DashboardLiveStatus: React.FC<DashboardLiveStatusProps> = ({ userId, projects, labels }) => {
  const router = useRouter();
  const pendingRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced refresh so a burst of updates does not hammer the server component re-render.
  const scheduleRefresh = useCallback((): void => {
    if (pendingRefreshTimeoutRef.current) {
      clearTimeout(pendingRefreshTimeoutRef.current);
    }
    pendingRefreshTimeoutRef.current = setTimeout(() => {
      pendingRefreshTimeoutRef.current = null;
      router.refresh();
    }, REFRESH_DEBOUNCE_MS);
  }, [router]);

  useEffect(() => {
    return () => {
      if (pendingRefreshTimeoutRef.current) {
        clearTimeout(pendingRefreshTimeoutRef.current);
      }
    };
  }, []);

  const { connectionStatus } = useProjectRealtime(userId, projects, scheduleRefresh);

  const label =
    connectionStatus === 'connected'
      ? labels.live
      : connectionStatus === 'connecting'
        ? labels.connecting
        : labels.offline;

  return (
    <span
      role="status"
      aria-live="polite"
      title={label}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium"
    >
      <span aria-hidden className={`inline-block size-2 rounded-full ${DOT_CLASSES[connectionStatus]}`} />
      <span className={TEXT_CLASSES[connectionStatus]}>{label}</span>
    </span>
  );
};
