import type { RefObject } from 'react';
import { useCallback } from 'react';
import type { PlayerRef } from '@remotion/player';
import api from '@/utils/services/api-frontend';
import { editorToolNames } from 'api-types';
import type { ShapeItemInput, ShapeKind } from 'api-types';
import type { SolidItem } from '../items/solid/solid-item-type';
import { addItem } from '../state/actions/add-item';
import type { EditorState } from '../state/types';
import { byDefaultKeepAspectRatioMap } from '../utils/aspect-ratio';
import type { FindSpaceStartPosition } from '../utils/find-space-for-item';
import { generateRandomId } from '../utils/generate-random-id';
import { revealTimelinePosition } from '../utils/reveal-timeline-position';
import { useCurrentStateAsRef, useWriteContext } from '../utils/use-context';
import { useGetProjectState } from './use-get-project-state';

export type AddShapeItemsOptions = {
  items: ShapeItemInput[];
  toolCallId?: string;
};

const DEFAULT_SHAPE_SIZE = 200;
const DEFAULT_SHAPE_DURATION_IN_FRAMES = 100;

const clampOpacity = (value: number | undefined) => Math.min(1, Math.max(0, value ?? 0.35));

const resolveFrame = ({
  frame,
  seconds,
  fps,
  fallback,
}: {
  frame?: number;
  seconds?: number;
  fps: number;
  fallback: number;
}): number => {
  if (frame !== undefined && seconds !== undefined && frame !== Math.round(seconds * fps)) {
    throw new Error('Conflicting frame and seconds timing fields');
  }
  if (frame !== undefined) return Math.max(0, Math.round(frame));
  if (seconds !== undefined) return Math.max(0, Math.round(seconds * fps));
  return fallback;
};

const getShapeSize = (request: ShapeItemInput) => {
  const requestedWidth = request.style?.width ?? DEFAULT_SHAPE_SIZE;
  const requestedHeight = request.style?.height ?? DEFAULT_SHAPE_SIZE;

  if (request.shapeKind === 'square' || request.shapeKind === 'circle') {
    const size = Math.max(requestedWidth, requestedHeight);
    return { width: size, height: size };
  }

  return { width: requestedWidth, height: requestedHeight };
};

const getBorderRadius = ({
  shapeKind,
  width,
  height,
  borderRadius,
}: {
  shapeKind: ShapeKind;
  width: number;
  height: number;
  borderRadius?: number;
}) => {
  if (shapeKind === 'circle' || shapeKind === 'ellipse') return Math.max(width, height);
  if (shapeKind === 'rounded_rectangle') return borderRadius ?? 24;
  return borderRadius ?? 0;
};

const createSolidShapeItem = ({
  request,
  fps,
  compositionWidth,
  compositionHeight,
  currentFrame,
}: {
  request: ShapeItemInput;
  fps: number;
  compositionWidth: number;
  compositionHeight: number;
  currentFrame: number;
}): SolidItem => {
  const { width, height } = getShapeSize(request);
  const from = resolveFrame({
    frame: request.startFrame,
    seconds: request.startTimeInSeconds,
    fps,
    fallback: currentFrame,
  });
  const durationInFrames = resolveFrame({
    frame: request.durationInFrames,
    seconds: request.durationInSeconds,
    fps,
    fallback: DEFAULT_SHAPE_DURATION_IN_FRAMES,
  });
  const centerX = request.xOnCanvas ?? compositionWidth / 2;
  const centerY = request.yOnCanvas ?? compositionHeight / 2;

  return {
    type: 'solid',
    color: request.style?.fillColor ?? '#000000',
    durationInFrames,
    from,
    top: request.style?.top ?? Math.round(centerY - height / 2),
    left: request.style?.left ?? Math.round(centerX - width / 2),
    width,
    height,
    isDraggingInTimeline: false,
    id: generateRandomId(),
    opacity: clampOpacity(request.style?.opacity),
    borderRadius: getBorderRadius({
      shapeKind: request.shapeKind,
      width,
      height,
      borderRadius: request.style?.borderRadius,
    }),
    rotation: request.style?.rotation ?? 0,
    keepAspectRatio: request.style?.keepAspectRatio ?? byDefaultKeepAspectRatioMap.solid,
    fadeInDurationInSeconds: request.style?.fadeInDurationInSeconds ?? 0,
    fadeOutDurationInSeconds: request.style?.fadeOutDurationInSeconds ?? 0,
  };
};

const itemsOverlap = (first: SolidItem, second: { from: number; durationInFrames: number }) =>
  first.from < second.from + second.durationInFrames && first.from + first.durationInFrames > second.from;

const boundsOverlap = (first: SolidItem, second: { left: number; top: number; width: number; height: number }) =>
  first.left < second.left + second.width &&
  first.left + first.width > second.left &&
  first.top < second.top + second.height &&
  first.top + first.height > second.top;

const getShapeLayerPosition = (state: EditorState, item: SolidItem): FindSpaceStartPosition => {
  const relatedOverlayTrackIndex = state.undoableState.tracks.findIndex((track) =>
    track.items.some((itemId) => {
      const existingItem = state.undoableState.items[itemId];
      if (!existingItem || (existingItem.type !== 'text' && existingItem.type !== 'captions')) return false;
      return itemsOverlap(item, existingItem) && boundsOverlap(item, existingItem);
    }),
  );

  if (relatedOverlayTrackIndex === -1) return { type: 'front' };
  return { type: 'directly-above', trackIndex: relatedOverlayTrackIndex + 1 };
};

export const useAddShapeItems = (playerRef?: RefObject<PlayerRef | null>) => {
  const { setState } = useWriteContext();
  const stateAsRef = useCurrentStateAsRef();
  const { mutateAsync: reportToolResult } = api.tools.reportToolResult.useMutation();
  const { buildProjectState } = useGetProjectState(playerRef);

  const addShapeItems = useCallback(
    async (options: AddShapeItemsOptions) => {
      const { toolCallId } = options;

      const reportResult = async (
        status: 'success' | 'skipped' | 'error',
        payload?: Record<string, unknown>,
        error?: string,
      ) => {
        if (!toolCallId) return;
        try {
          await reportToolResult({
            body: {
              toolCallId,
              toolName: editorToolNames.addShapeItems,
              status,
              output: payload,
              error,
            },
          });
        } catch {
          console.error('Failed to report tool result', { toolCallId, status });
        }
      };

      if (options.items.length === 0) {
        await reportResult('error', { error: 'No shape items provided' }, 'No shape items provided');
        return;
      }

      try {
        const currentState = stateAsRef.current;
        const { fps, compositionWidth, compositionHeight } = currentState.undoableState;
        const currentFrame = playerRef?.current?.getCurrentFrame() ?? 0;
        let nextState = currentState;
        const createdItems: {
          itemId: string;
          shapeKind: ShapeKind;
          trackId: string;
          startFrame: number;
          endFrame: number;
          startTimeInSeconds: number;
          endTimeInSeconds: number;
        }[] = [];

        for (const request of options.items) {
          const item = createSolidShapeItem({
            request,
            fps,
            compositionWidth,
            compositionHeight,
            currentFrame,
          });

          nextState = addItem({
            state: nextState,
            item,
            select: false,
            position: getShapeLayerPosition(nextState, item),
          });

          const trackId = nextState.undoableState.tracks.find((track) => track.items.includes(item.id))?.id ?? '';
          createdItems.push({
            itemId: item.id,
            shapeKind: request.shapeKind,
            trackId,
            startFrame: item.from,
            endFrame: item.from + item.durationInFrames,
            startTimeInSeconds: Number((item.from / fps).toFixed(3)),
            endTimeInSeconds: Number(((item.from + item.durationInFrames) / fps).toFixed(3)),
          });
        }

        nextState = {
          ...nextState,
          selectedItems: createdItems.map((item) => item.itemId),
        };

        setState({
          update: nextState,
          commitToUndoStack: true,
        });

        if (createdItems[0]) {
          revealTimelinePosition({
            state: nextState,
            frame: createdItems[0].startFrame,
            trackId: createdItems[0].trackId,
          });
        }

        await reportResult('success', {
          createdItems,
          createdItemIds: createdItems.map((item) => item.itemId),
          selectedItemIds: nextState.selectedItems,
          projectState: buildProjectState(nextState),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add shape items';
        await reportResult('error', { error: message }, message);
      }
    },
    [buildProjectState, playerRef, reportToolResult, setState, stateAsRef],
  );

  return { addShapeItems };
};
