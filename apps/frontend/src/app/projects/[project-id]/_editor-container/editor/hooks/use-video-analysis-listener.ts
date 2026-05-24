import { useEffect } from 'react';
import { realtimeMessageTypes, RealtimeMessage, VideoAnalysisCompletePayload } from 'api-types';
import { toast } from 'sonner';
import { useWebSocket } from '@/app/WebSocketProvider';
import { setAssetVideoAnalysisSummary } from '../state/actions/set-asset-video-analysis-summary';
import { useWriteContext } from '../utils/use-context';

export const useVideoAnalysisListener = (): void => {
  const { registerHandler } = useWebSocket();
  const { setState } = useWriteContext();

  useEffect(() => {
    const unregister = registerHandler(realtimeMessageTypes.videoAnalysisComplete, (message: RealtimeMessage<unknown>) => {
      const payload = message.payload as VideoAnalysisCompletePayload;

      if (!payload?.assetId) {
        console.warn('[VideoAnalysisListener] Missing assetId in payload');
        return;
      }

      setState({
        update: (state) =>
          setAssetVideoAnalysisSummary({
            state,
            assetId: payload.assetId,
            twelveLabs: payload.twelveLabs,
            summary: payload.summary,
            error: payload.error,
          }),
        commitToUndoStack: false,
      });

      if (payload.error) {
        toast.error('Video analysis failed', { description: payload.error });
      }
    });

    return unregister;
  }, [registerHandler, setState]);
};
