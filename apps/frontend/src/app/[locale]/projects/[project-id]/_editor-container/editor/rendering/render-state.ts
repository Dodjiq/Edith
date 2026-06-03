import type { FontInfo } from '@remotion/google-fonts';
import { taskIndicatorRef } from '../action-row/tasks-indicator/tasks-indicator';
import { EditorStarterAsset } from '../assets/assets';
import { SetState } from '../context-provider';
import { EditorStarterItem } from '../items/item-type';
import { addRenderingTask, updateRenderingTask } from '../state/actions/set-render-state';
import { TrackType } from '../state/types';
import { getApiUrl } from '../utils/api';
import { getEditorExportFileName } from '../utils/export-file-name';
import { generateRandomId } from '../utils/generate-random-id';
import { loadFontInfoFromApi } from '../utils/text/load-font-from-text-item';
import { CodecOption } from './codec-selector';
import { GetProgressPayload, GetProgressResponse, RenderVideoPayload } from './types';
import { apiClient } from '@/utils/services/api-client';

export type RenderingTaskState =
  | {
      type: 'render-initiated';
    }
  | {
      type: 'done';
      outputFile: string;
      outputSizeInBytes: number;
      doneAt: number;
    }
  | {
      type: 'in-progress';
      overallProgress: number;
    }
  | {
      type: 'error';
      error: string;
    };

export type RenderingTask = {
  id: string;
  outputName: string;
  status: RenderingTaskState;
  codec: CodecOption;
  durationInSeconds: number;
  startedAt: number;
  type: 'rendering';
};

const collectFontInfosForRendering = async (
  items: Record<string, EditorStarterItem>,
): Promise<Record<string, FontInfo>> => {
  const fontFamilies = new Set<string>();

  for (const item of Object.values(items)) {
    if (item.type === 'text' || item.type === 'captions') {
      fontFamilies.add(item.fontFamily);
    }
  }

  if (fontFamilies.size === 0) {
    return {};
  }

  const entries = await Promise.all(
    Array.from(fontFamilies).map(async (fontFamily) => {
      const fontInfo = await loadFontInfoFromApi(fontFamily);
      return [fontFamily, fontInfo] as const;
    }),
  );

  return Object.fromEntries(entries);
};

const getProgress = async ({
  bucketName,
  renderId,
  signal,
  setState,
  taskId,
}: {
  bucketName: string;
  renderId: string;
  signal: AbortSignal;
  setState: SetState;
  taskId: string;
}) => {
  try {
    const payload: GetProgressPayload = {
      bucketName,
      renderId,
    };

    const res = await fetch(getApiUrl('/api/progress'), {
      method: 'post',
      body: JSON.stringify(payload),
      signal,
    });

    const json = (await res.json()) as GetProgressResponse;

    if (json.type === 'done') {
      setState({
        commitToUndoStack: false,
        update: (prevState) => {
          return updateRenderingTask({
            state: prevState,
            taskId,
            newStatus: {
              type: 'done',
              outputFile: json.outputFile,
              outputSizeInBytes: json.outputSizeInBytes,
              doneAt: Date.now(),
            },
          });
        },
      });
      return;
    }

    if (json.type === 'error') {
      setState({
        commitToUndoStack: false,
        update: (prevState) => {
          return updateRenderingTask({
            state: prevState,
            taskId,
            newStatus: {
              type: 'error',
              error: json.error,
            },
          });
        },
      });
      return;
    }

    setState({
      commitToUndoStack: false,
      update: (prevState) => {
        return updateRenderingTask({
          state: prevState,
          taskId,
          newStatus: {
            type: 'in-progress',
            overallProgress: json.overallProgress,
          },
        });
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 250));
    await getProgress({ bucketName, renderId, signal, setState, taskId });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return;
    }

    throw err;
  }
};

export const triggerLambdaRender = async ({
  compositionHeight,
  compositionWidth,
  compositionDurationInSeconds,
  tracks,
  setState,
  assets,
  items,
  codec,
}: {
  compositionHeight: number;
  compositionWidth: number;
  compositionDurationInSeconds: number;
  tracks: TrackType[];
  setState: SetState;
  assets: Record<string, EditorStarterAsset>;
  items: Record<string, EditorStarterItem>;
  codec: 'h264' | 'vp8';
}) => {
  const taskId = generateRandomId();
  const controller = new AbortController();

  try {
    setState({
      commitToUndoStack: false,
      update: (prevState) => {
        return addRenderingTask({
          state: prevState,
          task: {
            id: taskId,
            status: { type: 'render-initiated' },
            codec,
            outputName: getEditorExportFileName(codec),
            durationInSeconds: compositionDurationInSeconds,
            startedAt: Date.now(),
            type: 'rendering',
          },
        });
      },
    });
    taskIndicatorRef.current?.open();

    const fontInfos = await collectFontInfosForRendering(items);

    const body: RenderVideoPayload = {
      compositionHeight,
      compositionWidth,
      tracks,
      assets,
      items,
      codec,
      fontInfos,
    };

    const response = await apiClient.render.startRender({
      body,
    });

    if (response.status !== 200) {
      const errorMessage =
        response.status === 400 && response.body && typeof response.body === 'object' && 'error' in response.body
          ? String(response.body.error)
          : String(response.status);
      throw new Error(`Error starting render: ${errorMessage}`);
    }

    if (
      response.body &&
      typeof response.body === 'object' &&
      'bucketName' in response.body &&
      'renderId' in response.body
    ) {
      const { bucketName, renderId } = response.body;

      await getProgress({
        bucketName,
        renderId,
        signal: controller.signal,
        setState,
        taskId,
      });
    } else {
      throw new Error('Render response missing success data');
    }
  } catch (e) {
    setState({
      update: (prevState) =>
        updateRenderingTask({
          state: prevState,
          taskId,
          newStatus: {
            type: 'error',
            error: e instanceof Error ? e.message : 'Unknown error',
          },
        }),
      commitToUndoStack: false,
    });
  }
};
