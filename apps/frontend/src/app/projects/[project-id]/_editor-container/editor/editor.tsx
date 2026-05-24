'use client';

import type { PlayerRef } from '@remotion/player';
import { Monitor } from 'lucide-react';
import { useCallback, useRef, useSyncExternalStore } from 'react';
import { Toaster } from 'sonner';
import Chatbot from '../../_chatbot/Chatbot';
import { ChatProvider } from '../../_chatbot/context/ChatContext';
import { ActionRow } from './action-row/action-row';
import { AssetDownloadFailureModal } from './asset-download-failure-modal';
import { DownloadRemoteAssets } from './caching/download-remote-assets';
import { UseLocalCachedAssets } from './caching/use-local-cached-assets';
import { ContextProvider } from './context-provider';
import { DevModeProvider } from './context/DevModeContext';
import './editor-starter.css';
import { EditorRealtimeBridge } from './realtime/editor-realtime-bridge';
import { FEATURE_RESIZE_TIMELINE_PANEL } from './flags';
import { ForceSpecificCursor } from './force-specific-cursor';
import { useTranscriptionListener } from './hooks/use-transcription-listener';
import { useUploadProgressListener } from './hooks/use-upload-progress-listener';
import { useVideoAnalysisListener } from './hooks/use-video-analysis-listener';
import { PlaybackControls } from './playback-controls';
import { PreviewSizeProvider } from './preview-size-provider';
import { TimelineResizer } from './timeline-resizer';
import { Timeline } from './timeline/timeline';
import { TimelineContainer } from './timeline/timeline-container';
import { TopPanel } from './top-panel';
import { EditorSidebar } from './editor-sidebar';
import { SidebarPanelProvider } from './sidebar-panel/sidebar-panel-context';
import { UploadDialog } from './upload-dialog';
import { UploadDialogProvider, useUploadDialog } from './upload-dialog-context';
import { WaitForInitialized } from './wait-for-initialized';

const SmallScreenMessage: React.FC = () => (
  <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-neutral-950 p-8 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-800">
      <Monitor className="h-8 w-8 text-neutral-400" />
    </div>
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold text-white">Desktop Required</h1>
      <p className="max-w-sm text-sm text-neutral-400">
        The video editor requires a larger screen to work properly. Please open this page on a desktop or laptop
        computer.
      </p>
    </div>
  </div>
);

interface EditorContentProps {
  playerRef: React.RefObject<PlayerRef | null>;
}

const EditorContent: React.FC<EditorContentProps> = ({ playerRef }) => {
  const { isUploadDialogOpen, closeUploadDialog } = useUploadDialog();

  // Listen for WebSocket events
  useUploadProgressListener();
  useTranscriptionListener();
  useVideoAnalysisListener();

  return (
    <>
      <PreviewSizeProvider>
        <ActionRow playerRef={playerRef} />
        <TopPanel playerRef={playerRef} />
      </PreviewSizeProvider>
      <PlaybackControls playerRef={playerRef} />
      {FEATURE_RESIZE_TIMELINE_PANEL && <TimelineResizer />}
      <TimelineContainer playerRef={playerRef}>
        <Timeline playerRef={playerRef} />
      </TimelineContainer>
      <UploadDialog isOpen={isUploadDialogOpen} onClose={closeUploadDialog} playerRef={playerRef} />
      <AssetDownloadFailureModal />
    </>
  );
};

const SMALL_SCREEN_QUERY = '(max-width: 1024px)';

const useIsSmallScreen = (): boolean => {
  const subscribe = useCallback((callback: () => void) => {
    const mq = window.matchMedia(SMALL_SCREEN_QUERY);
    mq.addEventListener('change', callback);
    return () => mq.removeEventListener('change', callback);
  }, []);

  const getSnapshot = useCallback(() => window.matchMedia(SMALL_SCREEN_QUERY).matches, []);
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

export const Editor: React.FC = () => {
  const playerRef = useRef<PlayerRef | null>(null);
  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenMessage />;
  }

  return (
    <ContextProvider>
      <DevModeProvider>
        <ChatProvider>
          <SidebarPanelProvider>
            <EditorRealtimeBridge playerRef={playerRef} />
            <div className="flex h-screen w-full overflow-hidden">
              <EditorSidebar />
              <div className="bg-editor-starter-bg flex h-full min-w-0 flex-1 flex-col items-center justify-between">
                <UploadDialogProvider>
                  <WaitForInitialized>
                    <EditorContent playerRef={playerRef} />
                  </WaitForInitialized>
                </UploadDialogProvider>
              </div>
              <Chatbot playerRef={playerRef} />
            </div>
            <ForceSpecificCursor />
            <DownloadRemoteAssets />
            <UseLocalCachedAssets />
            <Toaster theme="dark" position="top-right" />
          </SidebarPanelProvider>
        </ChatProvider>
      </DevModeProvider>
    </ContextProvider>
  );
};
