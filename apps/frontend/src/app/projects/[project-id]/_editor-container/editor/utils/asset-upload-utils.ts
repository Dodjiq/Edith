import { toast } from 'sonner';
import { EditorStarterAsset } from '../assets/assets';
import { SetState } from '../context-provider';
import { finishUpload } from '../state/actions/finish-upload';
import { startTranscribing } from '../state/actions/start-transcribing';
import { setUploadError } from '../state/actions/set-upload-error';
import { setUploadProgress } from '../state/actions/set-upload-progress';
import { directS3Upload } from './upload';

export interface UploadResult {
  readUrl: string;
  fileKey: string;
}

/**
 * Utility function to safely get error message from unknown error
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error occurred';
};

/**
 * Utility function to safely get error stack from unknown error
 */
export const getErrorStack = (error: unknown): string => {
  if (error instanceof Error) {
    return error.stack || error.message;
  }
  return 'Unknown error';
};

/**
 * Upload asset directly to S3 using multipart presigned URLs.
 *
 * Progress tracking:
 * - Upload progress (0-100%) is tracked locally during chunk uploads
 * - After upload completes, server triggers transcription asynchronously
 * - Transcription progress/completion arrives via WebSocket
 */
export const attemptAssetUpload = async ({
  setState,
  asset,
  file,
  projectId,
}: {
  setState: SetState;
  asset: EditorStarterAsset;
  file: Blob;
  projectId?: string;
}): Promise<UploadResult> => {
  console.debug('[Upload] Starting multipart S3 upload for:', asset.filename, 'assetId:', asset.id);

  // Compute needsTranscription once based on asset.type (source of truth)
  const needsTranscription = asset.type === 'video' || asset.type === 'audio';
  const needsVideoAnalysis = asset.type === 'video';

  const result = await directS3Upload({
    file,
    filename: asset.filename,
    assetId: asset.id,
    contentType: asset.mimeType,
    needsTranscription,
    needsVideoAnalysis,
    projectId,
    onProgress: (progress) => {
      setState({
        update: (state) =>
          setUploadProgress({
            state,
            asset,
            uploadProgress: progress,
          }),
        commitToUndoStack: false,
      });
    },
  });

  console.debug('[Upload] S3 upload complete:', {
    fileKey: result.fileKey,
    readUrl: result.readUrl,
  });

  if (needsTranscription) {
    // Video/audio: Set status to 'transcribing' - transcription will arrive via WebSocket
    console.debug('[Upload] Waiting for transcription via WebSocket');
    setState({
      update: (state) =>
        startTranscribing({
          state,
          asset,
          remoteUrl: result.readUrl,
          remoteFileKey: result.fileKey,
        }),
      commitToUndoStack: false,
    });
  } else {
    // Images/GIFs: No transcription needed, mark as fully uploaded
    setState({
      update: (state) =>
        finishUpload({
          state,
          asset,
          remoteUrl: result.readUrl,
          remoteFileKey: result.fileKey,
        }),
      commitToUndoStack: false,
    });
  }

  return {
    readUrl: result.readUrl,
    fileKey: result.fileKey,
  };
};

/**
 * Complete upload workflow with error handling
 */
export const performAssetUpload = async ({
  setState,
  asset,
  file,
  projectId,
}: {
  setState: SetState;
  asset: EditorStarterAsset;
  file: Blob;
  projectId?: string;
}): Promise<void> => {
  try {
    await attemptAssetUpload({ setState, asset, file, projectId });
  } catch (uploadError) {
    console.error('[Upload] Failed:', uploadError);
    setState({
      update: (state) =>
        setUploadError({
          state,
          assetId: asset.id,
          error: uploadError as Error,
          canRetry: true,
        }),
      commitToUndoStack: false,
    });
    toast.error('Upload failed');
  }
};
