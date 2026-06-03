import { useEffect } from 'react';
import { realtimeMessageTypes, RealtimeMessage, UploadProgressPayload } from 'api-types';
import { useWebSocket } from '@/app/WebSocketProvider';
import { useWriteContext } from '../utils/use-context';
import { setUploadError } from '../state/actions/set-upload-error';
import { finishUploadWithoutTranscription } from '../state/actions/finish-upload-without-transcription';

/**
 * Hook that listens for WebSocket upload/transcription events.
 *
 * Progress tracking:
 * - Upload progress (0-100%) is tracked client-side via directS3Upload
 * - Transcription status is set via startTranscribing action (no server progress)
 * - Transcription completion with data is handled by useTranscriptionListener
 *
 * This hook handles:
 * - 'error' phase: Sets asset to error state
 * - 'complete' phase: Marks asset as uploaded (for non-transcribable files)
 *
 * Note: We don't validate against current assets state here because:
 * 1. State updaters (setUploadError, finishUploadWithoutTranscription) work with assetId directly
 * 2. Capturing assets in closure causes stale state issues when messages arrive before effect re-runs
 */
export const useUploadProgressListener = (): void => {
  const { registerHandler } = useWebSocket();
  const { setState } = useWriteContext();

  useEffect(() => {
    const unregister = registerHandler(realtimeMessageTypes.uploadProgress, (message: RealtimeMessage<unknown>) => {
      const payload = message.payload as UploadProgressPayload;

      if (!payload?.assetId) {
        return;
      }

      if (payload.phase === 'error') {
        // Handle transcription errors from server
        setState({
          update: (state) =>
            setUploadError({
              state,
              assetId: payload.assetId,
              error: new Error(payload.error || 'Transcription failed'),
              canRetry: false,
            }),
          commitToUndoStack: false,
        });
      } else if (payload.phase === 'complete') {
        // Handle completion for files that don't need transcription
        // (e.g., server detected file is not audio/video despite frontend request)
        console.debug('[UploadProgressListener] Upload complete without transcription:', payload.assetId);
        setState({
          update: (state) => finishUploadWithoutTranscription({ state, assetId: payload.assetId }),
          commitToUndoStack: false,
        });
      }
      // 'transcribing' phase: Already set by startTranscribing action locally
    });

    return unregister;
  }, [registerHandler, setState]);
};
