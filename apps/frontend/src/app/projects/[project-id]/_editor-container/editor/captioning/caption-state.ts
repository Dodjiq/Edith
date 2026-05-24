import { Caption } from '@remotion/captions';
import { taskIndicatorRef } from '../action-row/tasks-indicator/tasks-indicator';
import { AudioAsset, VideoAsset } from '../assets/assets';
import { SetState } from '../context-provider';
import { addCaptioningTask, deleteCaptioningTask, updateCaptioningTask } from '../state/actions/set-caption-state';
import { generateRandomId } from '../utils/generate-random-id';
import { uploadWithProgress } from '../utils/upload';
import { extractAudio } from './audio-buffer-to-mp3';
import { apiClient } from '@/utils/services/api-client';

/** Fetch captions from backend proxy (avoids CORS issues with S3) */
const fetchCaptionsFromBackend = async (captionsKey: string): Promise<Caption[]> => {
  const response = await apiClient.captions.getCaptions({
    body: { captionsKey },
  });

  if (response.status !== 200) {
    throw new Error('Failed to download captions');
  }

  return response.body.captions as Caption[];
};

const AUTO_CLEAR_DELAY_MS = 5000; // Auto-clear completed tasks after 5 seconds

/**
 * Schedule auto-deletion of a captioning task after a delay.
 * This prevents completed/failed tasks from staying in the indicator forever.
 */
const scheduleTaskDeletion = (setState: SetState, taskId: string, delayMs = AUTO_CLEAR_DELAY_MS) => {
  setTimeout(() => {
    setState({
      commitToUndoStack: false,
      update: (prevState) => deleteCaptioningTask({ state: prevState, taskId }),
    });
  }, delayMs);
};

export type CaptioningTaskStatus =
  | {
      type: 'extracting-audio';
      src: string;
    }
  | {
      type: 'uploading-audio';
      progress: number;
      loadedBytes: number;
      totalBytes: number;
    }
  | {
      type: 'captioning';
    }
  | {
      type: 'error';
      error: Error;
    }
  | {
      type: 'done';
      captions: Caption[];
      doneAt: number;
      captionItemId: string;
    };

export type CaptioningTask = {
  id: string;
  assetId: string;
  filename: string;
  assetType: 'video' | 'audio';
  status: CaptioningTaskStatus;
  startedAt: number;
  type: 'captioning';
};

export const getCaptions = async ({
  src,
  setState,
  asset,
  captionItemId,
}: {
  src: string;
  setState: SetState;
  asset: AudioAsset | VideoAsset;
  captionItemId: string;
}) => {
  const taskId = generateRandomId();

  try {
    setState({
      commitToUndoStack: false,
      update: (prevState) => {
        return addCaptioningTask({
          state: prevState,
          newTask: {
            id: taskId,
            assetId: asset.id,
            filename: asset.filename,
            assetType: asset.type,
            status: { type: 'extracting-audio', src },
            startedAt: Date.now(),
            type: 'captioning',
          },
        });
      },
    });

    taskIndicatorRef.current?.open();

    const audio = await extractAudio(src);
    const audioFile = new File([audio.buffer], `audio${audio.extension}`, {
      type: audio.mimeType,
    });

    // Get a presigned URL for upload via NestJS backend
    const presignResponse = await apiClient.upload.getPresignedUrl({
      body: {
        contentType: audio.mimeType,
        size: audio.buffer.byteLength,
      },
    });

    if (presignResponse.status !== 200) {
      const body = presignResponse.body as { message?: string };
      throw new Error(body.message ?? 'Failed to get upload URL');
    }

    const presignData = presignResponse.body;

    // Upload the audio file to S3 with progress
    await uploadWithProgress({
      file: audioFile,
      url: presignData.presignedUrl,
      onProgress: ({ progress, loadedBytes, totalBytes }) => {
        setState({
          commitToUndoStack: false,
          update: (prevState) => {
            return updateCaptioningTask({
              state: prevState,
              taskId,
              newStatus: {
                type: 'uploading-audio',
                progress,
                loadedBytes,
                totalBytes,
              },
            });
          },
        });
      },
    });

    setState({
      commitToUndoStack: false,
      update: (prevState) => {
        return updateCaptioningTask({
          state: prevState,
          taskId,
          newStatus: { type: 'captioning' },
        });
      },
    });

    // Request captions using the file key via ts-rest
    const response = await apiClient.captions.generateCaptions({
      body: { fileKey: presignData.fileKey },
    });

    if (response.status === 400) {
      throw new Error(response.body.message ?? 'Failed to get captions');
    }

    if (response.status !== 200) {
      throw new Error('Failed to get captions');
    }

    // Handle empty captions as an error
    if (response.body.captionsCount === 0) {
      const noResultsError = new Error('Transcription returned no captions');
      setState({
        commitToUndoStack: false,
        update: (prevState) => {
          return updateCaptioningTask({
            state: prevState,
            taskId,
            newStatus: { type: 'error', error: noResultsError },
          });
        },
      });
      scheduleTaskDeletion(setState, taskId);
      return undefined;
    }

    // Fetch captions via backend proxy (avoids CORS issues with S3)
    const captions = await fetchCaptionsFromBackend(response.body.captionsKey);

    setState({
      commitToUndoStack: false,
      update: (prevState) => {
        return updateCaptioningTask({
          state: prevState,
          taskId,
          newStatus: {
            type: 'done',
            captions,
            doneAt: Date.now(),
            captionItemId,
          },
        });
      },
    });
    scheduleTaskDeletion(setState, taskId);
    return captions;
  } catch (err) {
    setState({
      commitToUndoStack: false,
      update: (prevState) => {
        return updateCaptioningTask({
          state: prevState,
          taskId,
          newStatus: { type: 'error', error: err as Error },
        });
      },
    });
    scheduleTaskDeletion(setState, taskId);
    throw err;
  }
};

/**
 * Generate captions from a pre-mixed audio buffer (ArrayBuffer).
 * Used for multi-item captioning where audio has already been mixed client-side.
 */
export const getCaptionsFromBuffer = async ({
  audioBuffer,
  audioMimeType = 'audio/mpeg',
  audioExtension = '.mp3',
  setState,
  captionItemId,
  filename = `mixed-audio${audioExtension}`,
}: {
  audioBuffer: ArrayBuffer;
  audioMimeType?: string;
  audioExtension?: string;
  setState: SetState;
  captionItemId: string;
  filename?: string;
}) => {
  const taskId = generateRandomId();

  try {
    setState({
      commitToUndoStack: false,
      update: (prevState) => {
        return addCaptioningTask({
          state: prevState,
          newTask: {
            id: taskId,
            assetId: `mixed-${taskId}`,
            filename,
            assetType: 'audio',
            status: { type: 'extracting-audio', src: 'mixed-timeline-audio' },
            startedAt: Date.now(),
            type: 'captioning',
          },
        });
      },
    });

    taskIndicatorRef.current?.open();

    const audioFile = new File([audioBuffer], filename, {
      type: audioMimeType,
    });

    // Get a presigned URL for upload via NestJS backend
    const presignResponse2 = await apiClient.upload.getPresignedUrl({
      body: {
        contentType: audioMimeType,
        size: audioBuffer.byteLength,
      },
    });

    if (presignResponse2.status !== 200) {
      const body = presignResponse2.body as { message?: string };
      throw new Error(body.message ?? 'Failed to get upload URL');
    }

    const presignData2 = presignResponse2.body;

    // Upload the audio file to S3 with progress
    await uploadWithProgress({
      file: audioFile,
      url: presignData2.presignedUrl,
      onProgress: ({ progress, loadedBytes, totalBytes }) => {
        setState({
          commitToUndoStack: false,
          update: (prevState) => {
            return updateCaptioningTask({
              state: prevState,
              taskId,
              newStatus: {
                type: 'uploading-audio',
                progress,
                loadedBytes,
                totalBytes,
              },
            });
          },
        });
      },
    });

    setState({
      commitToUndoStack: false,
      update: (prevState) => {
        return updateCaptioningTask({
          state: prevState,
          taskId,
          newStatus: { type: 'captioning' },
        });
      },
    });

    // Request captions using the file key via ts-rest
    const response = await apiClient.captions.generateCaptions({
      body: { fileKey: presignData2.fileKey },
    });

    if (response.status === 400) {
      throw new Error(response.body.message ?? 'Failed to get captions');
    }

    if (response.status !== 200) {
      throw new Error('Failed to get captions');
    }

    // Handle empty captions as an error
    if (response.body.captionsCount === 0) {
      const noResultsError = new Error('Transcription returned no captions');
      setState({
        commitToUndoStack: false,
        update: (prevState) => {
          return updateCaptioningTask({
            state: prevState,
            taskId,
            newStatus: { type: 'error', error: noResultsError },
          });
        },
      });
      scheduleTaskDeletion(setState, taskId);
      return undefined;
    }

    // Fetch captions via backend proxy (avoids CORS issues with S3)
    const captions = await fetchCaptionsFromBackend(response.body.captionsKey);

    setState({
      commitToUndoStack: false,
      update: (prevState) => {
        return updateCaptioningTask({
          state: prevState,
          taskId,
          newStatus: {
            type: 'done',
            captions,
            doneAt: Date.now(),
            captionItemId,
          },
        });
      },
    });
    scheduleTaskDeletion(setState, taskId);
    return captions;
  } catch (err) {
    setState({
      commitToUndoStack: false,
      update: (prevState) => {
        return updateCaptioningTask({
          state: prevState,
          taskId,
          newStatus: { type: 'error', error: err as Error },
        });
      },
    });
    scheduleTaskDeletion(setState, taskId);
    throw err;
  }
};
