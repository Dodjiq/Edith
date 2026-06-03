import { useEffect } from 'react';
import { Caption } from '@remotion/captions';
import { realtimeMessageTypes, RealtimeMessage, TranscriptionCompletePayload } from 'api-types';
import { toast } from 'sonner';
import { useWebSocket } from '@/app/WebSocketProvider';
import { useWriteContext } from '../utils/use-context';
import { setAssetTranscription } from '../state/actions/set-asset-transcription';
import { finishUploadWithoutTranscription } from '../state/actions/finish-upload-without-transcription';
import { useSilentTranscriptionStore } from '../state/silent-transcription-store';

/**
 * Hook that listens for WebSocket transcription complete events and updates asset state.
 *
 * When a video/audio file is uploaded via direct S3 upload, transcription is processed
 * asynchronously through ElevenLabs Scribe v2, with Rust audio extraction for videos.
 * The result is delivered via WebSocket to this listener.
 *
 * Note: We don't validate against current assets state here because:
 * 1. State updaters (setAssetTranscription, finishUploadWithoutTranscription) have their own null-safety
 * 2. Capturing assets in closure causes stale state issues when messages arrive before effect re-runs
 */
export const useTranscriptionListener = (): void => {
  const { registerHandler } = useWebSocket();
  const { setState } = useWriteContext();

  useEffect(() => {
    const unregister = registerHandler(
      realtimeMessageTypes.transcriptionComplete,
      (message: RealtimeMessage<unknown>) => {
        const payload = message.payload as TranscriptionCompletePayload;

        if (!payload?.assetId) {
          console.warn('[TranscriptionListener] Missing assetId in payload');
          return;
        }

        if (!payload.transcription || payload.transcription.length === 0) {
          const hasNoTranscription = payload.hasNoTranscription === true;
          console.debug(
            '[TranscriptionListener] No transcription data for asset:',
            payload.assetId,
            hasNoTranscription ? '(no speech detected)' : '',
          );
          // Mark as uploaded, with hasNoTranscription flag if applicable
          setState({
            update: (state) =>
              finishUploadWithoutTranscription({
                state,
                assetId: payload.assetId,
                hasNoTranscription,
                metadata: payload.metadata,
              }),
            commitToUndoStack: false,
          });
          return;
        }

        // Convert API transcription to Caption format (normalize field names)
        // Remotion expects each word (except the first) to have a leading space
        const captions: Caption[] = payload.transcription
          .map((word) => ({
            text: word.text,
            startMs: word.startMs,
            endMs: word.endMs,
            timestampMs: word.timestampMs,
            confidence: word.confidence,
          }))
          .sort((a, b) => a.startMs - b.startMs)
          .map((caption, index) => ({
            ...caption,
            text: index === 0 ? caption.text : ` ${caption.text}`,
          }));

        console.debug(
          '[TranscriptionListener] Received transcription for asset:',
          payload.assetId,
          'words:',
          captions.length,
        );

        setState({
          update: (state) =>
            setAssetTranscription({
              state,
              assetId: payload.assetId,
              transcription: captions,
              metadata: payload.metadata,
            }),
          commitToUndoStack: false,
        });

        // Only show toast if not suppressed (upload dialog or AI agent active)
        const { shouldSuppressToast, removeSilentAsset } = useSilentTranscriptionStore.getState();
        if (!shouldSuppressToast(payload.assetId)) {
          toast.success('Transcription complete', {
            description: `${captions.length} words transcribed`,
          });
        }
        // Clean up silent asset entry after processing
        removeSilentAsset(payload.assetId);
      },
    );

    return unregister;
  }, [registerHandler, setState]);
};
