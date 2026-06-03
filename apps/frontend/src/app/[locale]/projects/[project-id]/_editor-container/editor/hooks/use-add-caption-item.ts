import { useCallback } from 'react';
import { CaptionStyleInput, Caption } from 'api-types';
import { getAssetStartInSeconds, getDurationInSecondsOfCaptionAsset } from '../assets/utils';
import { addCaptionAsset } from '../state/actions/add-caption-asset';
import { addItem } from '../state/actions/add-item';
import { EditorState, TrackType } from '../state/types';
import { CaptionsItem } from '../items/captions/captions-item-type';
import { VideoItem } from '../items/video/video-item-type';
import { AudioItem } from '../items/audio/audio-item-type';
import { useCurrentStateAsRef, useDimensions, useFps, useWriteContext } from '../utils/use-context';
import { EditorStarterItem } from '../items/item-type';

type CaptionTargetItem = VideoItem | AudioItem;

type AddCaptionItemParams = {
  targetItem: CaptionTargetItem;
  captions: Caption[];
  captionItemId: string;
  styleOverrides?: CaptionStyleInput;
  replaceExisting?: boolean;
};

type AddCaptionItemResult = {
  captionItemId: string;
  captionAssetId: string;
  replacedItemId?: string;
  appliedStyle: CaptionStyleState;
  editorState: EditorState;
};

type CaptionStyleState = Omit<
  CaptionsItem,
  'type' | 'assetId' | 'durationInFrames' | 'from' | 'id' | 'isDraggingInTimeline'
>;

const DEFAULT_CAPTION_STYLE: CaptionStyleState = {
  left: 480,
  top: 950,
  width: 960,
  height: 120,
  opacity: 1,
  rotation: 0,
  fontFamily: 'Roboto',
  fontStyle: {
    variant: 'normal',
    weight: '400',
  },
  lineHeight: 1.35,
  letterSpacing: 0.5,
  fontSize: 42,
  align: 'center',
  color: '#FFFFFF',
  highlightColor: '#FFFFFF',
  direction: 'ltr',
  pageDurationInMilliseconds: 3500,
  captionStartInSeconds: 0,
  strokeWidth: 2,
  strokeColor: 'black',
  maxLines: 2,
  fadeInDurationInSeconds: 0,
  fadeOutDurationInSeconds: 0,
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const rangesOverlap = (aStart: number, aEnd: number, bStart: number, bEnd: number) => {
  return aStart <= bEnd && bStart <= aEnd;
};

const pickStyleFromItem = (item: CaptionsItem): CaptionStyleState => ({
  align: item.align,
  captionStartInSeconds: item.captionStartInSeconds,
  color: item.color,
  direction: item.direction,
  fadeInDurationInSeconds: item.fadeInDurationInSeconds,
  fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
  fontFamily: item.fontFamily,
  fontSize: item.fontSize,
  fontStyle: item.fontStyle,
  height: item.height,
  highlightColor: item.highlightColor,
  left: item.left,
  letterSpacing: item.letterSpacing,
  lineHeight: item.lineHeight,
  maxLines: item.maxLines,
  opacity: item.opacity,
  pageDurationInMilliseconds: item.pageDurationInMilliseconds,
  rotation: item.rotation,
  strokeColor: item.strokeColor,
  strokeWidth: item.strokeWidth,
  top: item.top,
  width: item.width,
});

const resolveCaptionStyle = ({
  baseStyle,
  overrides,
  compositionWidth,
  compositionHeight,
  targetStartInSeconds,
  useExistingCaptionStart,
}: {
  baseStyle: CaptionStyleState;
  overrides?: CaptionStyleInput;
  compositionWidth: number;
  compositionHeight: number;
  targetStartInSeconds: number;
  useExistingCaptionStart: boolean;
}): CaptionStyleState => {
  const mergedFontStyle = overrides?.fontStyle
    ? {
        variant: overrides.fontStyle.variant ?? baseStyle.fontStyle.variant,
        weight: overrides.fontStyle.weight ?? baseStyle.fontStyle.weight,
      }
    : baseStyle.fontStyle;

  const lineHeight = overrides?.lineHeight ?? baseStyle.lineHeight;
  const fontSize = overrides?.fontSize ?? baseStyle.fontSize;
  const maxLines = overrides?.maxLines ?? baseStyle.maxLines;
  const resolvedHeight = overrides?.height ?? fontSize * lineHeight * maxLines;
  const width = overrides?.width ?? baseStyle.width;
  const resolvedCompositionWidth = compositionWidth || width;
  const resolvedCompositionHeight = compositionHeight || resolvedHeight;
  const widthLimit = resolvedCompositionWidth > 0 ? resolvedCompositionWidth : width;
  const heightLimit = resolvedCompositionHeight > 0 ? resolvedCompositionHeight : resolvedHeight;
  const finalWidth = Math.max(20, Math.min(width, widthLimit));
  const finalHeight = Math.max(20, Math.min(resolvedHeight, heightLimit));
  const leftFallback =
    overrides?.left ??
    baseStyle.left ??
    (resolvedCompositionWidth > 0 ? (resolvedCompositionWidth - finalWidth) / 2 : 0);
  const topFallback = overrides?.top ?? baseStyle.top;

  const resolvedHighlightColor =
    overrides && Object.prototype.hasOwnProperty.call(overrides, 'highlightColor')
      ? (overrides.highlightColor ?? overrides.color ?? baseStyle.color ?? baseStyle.highlightColor)
      : (baseStyle.highlightColor ?? baseStyle.color);

  return {
    align: overrides?.align ?? baseStyle.align,
    captionStartInSeconds: clamp(
      overrides?.captionStartInSeconds ??
        (useExistingCaptionStart ? baseStyle.captionStartInSeconds : targetStartInSeconds) ??
        targetStartInSeconds,
      0,
      Number.MAX_SAFE_INTEGER,
    ),
    color: overrides?.color ?? baseStyle.color,
    direction: overrides?.direction ?? baseStyle.direction,
    fadeInDurationInSeconds: overrides?.fadeInDurationInSeconds ?? baseStyle.fadeInDurationInSeconds,
    fadeOutDurationInSeconds: overrides?.fadeOutDurationInSeconds ?? baseStyle.fadeOutDurationInSeconds,
    fontFamily: overrides?.fontFamily ?? baseStyle.fontFamily,
    fontSize,
    fontStyle: mergedFontStyle,
    height: finalHeight,
    highlightColor: resolvedHighlightColor,
    left: clamp(leftFallback ?? 0, 0, Math.max(0, widthLimit - finalWidth)),
    letterSpacing: overrides?.letterSpacing ?? baseStyle.letterSpacing,
    lineHeight,
    maxLines,
    opacity: overrides?.opacity ?? baseStyle.opacity,
    pageDurationInMilliseconds: overrides?.pageDurationInMilliseconds ?? baseStyle.pageDurationInMilliseconds,
    rotation: overrides?.rotation ?? baseStyle.rotation,
    strokeColor: overrides?.strokeColor ?? baseStyle.strokeColor,
    strokeWidth: overrides?.strokeWidth ?? baseStyle.strokeWidth,
    top: clamp(topFallback ?? 0, 0, Math.max(0, heightLimit - finalHeight)),
    width: finalWidth,
  };
};

export const findExistingCaptionForTarget = ({
  items,
  tracks,
  targetItem,
}: {
  items: Record<string, EditorStarterItem>;
  tracks: TrackType[];
  targetItem: CaptionTargetItem;
}): CaptionsItem | null => {
  const targetTrackIndex = tracks.findIndex((track) => track.items.includes(targetItem.id));
  const targetStart = targetItem.from;
  const targetEnd = targetItem.from + targetItem.durationInFrames;

  for (let index = 0; index < tracks.length; index += 1) {
    if (targetTrackIndex !== -1 && Math.abs(index - targetTrackIndex) > 1) {
      continue;
    }

    const track = tracks[index];
    for (const id of track.items) {
      const item = items[id];
      if (!item || item.type !== 'captions') continue;

      const itemEnd = item.from + item.durationInFrames;
      if (rangesOverlap(targetStart, targetEnd, item.from, itemEnd)) {
        return item;
      }
    }
  }

  return null;
};

export const useAddCaptionItem = () => {
  const { fps } = useFps();
  const { compositionWidth, compositionHeight } = useDimensions();
  const { setState } = useWriteContext();
  const stateRef = useCurrentStateAsRef();

  return useCallback(
    ({
      targetItem,
      captions,
      captionItemId,
      styleOverrides,
      replaceExisting = true,
    }: AddCaptionItemParams): AddCaptionItemResult | null => {
      const currentState = stateRef.current;
      if (!currentState) {
        return null;
      }

      try {
        const { state: stateWithAsset, asset: captionAsset } = addCaptionAsset({
          state: currentState,
          captions,
          filename: 'captions.srt',
        });

        const targetTrackIndex = stateWithAsset.undoableState.tracks.findIndex((track) =>
          track.items.includes(targetItem.id),
        );

        const startPosition =
          targetTrackIndex >= 0
            ? ({ type: 'directly-above', trackIndex: targetTrackIndex } as const)
            : ({ type: 'front' } as const);

        const existingCaption =
          replaceExisting === false
            ? null
            : findExistingCaptionForTarget({
                items: stateWithAsset.undoableState.items,
                tracks: stateWithAsset.undoableState.tracks,
                targetItem,
              });

        const resolvedStyle = resolveCaptionStyle({
          baseStyle: existingCaption ? pickStyleFromItem(existingCaption) : DEFAULT_CAPTION_STYLE,
          overrides: styleOverrides,
          compositionWidth: stateWithAsset.undoableState.compositionWidth ?? compositionWidth,
          compositionHeight: stateWithAsset.undoableState.compositionHeight ?? compositionHeight,
          targetStartInSeconds: getAssetStartInSeconds(targetItem) ?? 0,
          useExistingCaptionStart: Boolean(existingCaption),
        });

        const durationInFrames = Math.max(
          1,
          Math.round(
            Math.max(0, getDurationInSecondsOfCaptionAsset(captionAsset) - (resolvedStyle.captionStartInSeconds ?? 0)) *
              fps,
          ),
        );

        const finalItemId = existingCaption?.id ?? captionItemId;

        const captionItem: CaptionsItem = {
          ...resolvedStyle,
          type: 'captions',
          assetId: captionAsset.id,
          durationInFrames,
          from: targetItem.from,
          id: finalItemId,
          isDraggingInTimeline: false,
        };

        let nextState: EditorState | null = null;
        let result: AddCaptionItemResult | null = null;

        if (existingCaption && replaceExisting !== false) {
          const nextItems = { ...stateWithAsset.undoableState.items, [finalItemId]: captionItem };
          nextState = {
            ...stateWithAsset,
            undoableState: {
              ...stateWithAsset.undoableState,
              items: nextItems,
            },
            selectedItems: [finalItemId],
          };
          result = {
            captionItemId: finalItemId,
            captionAssetId: captionAsset.id,
            replacedItemId: existingCaption.id,
            appliedStyle: resolvedStyle,
            editorState: nextState,
          };
        } else {
          nextState = addItem({
            state: stateWithAsset,
            item: captionItem,
            select: true,
            position: startPosition,
          });
          result = {
            captionItemId: finalItemId,
            captionAssetId: captionAsset.id,
            appliedStyle: resolvedStyle,
            editorState: nextState,
          };
        }

        setState({
          commitToUndoStack: true,
          update: nextState,
        });

        return result;
      } catch (error) {
        console.error('[useAddCaptionItem] Error while adding caption:', error);
        return null;
      }
    },
    [compositionHeight, compositionWidth, fps, setState, stateRef],
  );
};

type AddCaptionItemForMultipleTargetsParams = {
  targetItems: CaptionTargetItem[];
  captions: Caption[];
  captionItemId: string;
  styleOverrides?: CaptionStyleInput;
  replaceExisting?: boolean;
};

/**
 * Hook to add a caption item spanning multiple target items (video/audio).
 * The caption starts at the first item's position and spans to the end of the last item.
 */
export const useAddCaptionItemForMultipleTargets = () => {
  const { fps } = useFps();
  const { compositionWidth, compositionHeight } = useDimensions();
  const { setState } = useWriteContext();
  const stateRef = useCurrentStateAsRef();

  return useCallback(
    ({
      targetItems,
      captions,
      captionItemId,
      styleOverrides,
      replaceExisting = true,
    }: AddCaptionItemForMultipleTargetsParams): AddCaptionItemResult | null => {
      const currentState = stateRef.current;
      if (!currentState || targetItems.length === 0) {
        return null;
      }

      try {
        // Sort items by timeline position
        const sortedItems = [...targetItems].sort((a, b) => a.from - b.from);
        const firstItem = sortedItems[0];
        const lastItem = sortedItems[sortedItems.length - 1];

        // Calculate timeline range
        const captionStart = firstItem.from;
        const captionEnd = lastItem.from + lastItem.durationInFrames;
        const totalDurationInFrames = captionEnd - captionStart;

        const { state: stateWithAsset, asset: captionAsset } = addCaptionAsset({
          state: currentState,
          captions,
          filename: 'captions.srt',
        });

        // Find the track of the first item for placement
        const targetTrackIndex = stateWithAsset.undoableState.tracks.findIndex((track) =>
          track.items.includes(firstItem.id),
        );

        const startPosition =
          targetTrackIndex >= 0
            ? ({ type: 'directly-above', trackIndex: targetTrackIndex } as const)
            : ({ type: 'front' } as const);

        // Check for existing caption overlapping with first item
        const existingCaption =
          replaceExisting === false
            ? null
            : findExistingCaptionForTarget({
                items: stateWithAsset.undoableState.items,
                tracks: stateWithAsset.undoableState.tracks,
                targetItem: firstItem,
              });

        const resolvedStyle = resolveCaptionStyle({
          baseStyle: existingCaption ? pickStyleFromItem(existingCaption) : DEFAULT_CAPTION_STYLE,
          overrides: styleOverrides,
          compositionWidth: stateWithAsset.undoableState.compositionWidth ?? compositionWidth,
          compositionHeight: stateWithAsset.undoableState.compositionHeight ?? compositionHeight,
          targetStartInSeconds: 0, // For multi-item, we start at 0 relative to the mixed audio
          useExistingCaptionStart: Boolean(existingCaption),
        });

        // Use the total duration spanning all items
        const durationInFrames = Math.max(1, totalDurationInFrames);

        const finalItemId = existingCaption?.id ?? captionItemId;

        const captionItem: CaptionsItem = {
          ...resolvedStyle,
          type: 'captions',
          assetId: captionAsset.id,
          durationInFrames,
          from: captionStart,
          id: finalItemId,
          isDraggingInTimeline: false,
        };

        let nextState: EditorState | null = null;
        let result: AddCaptionItemResult | null = null;

        if (existingCaption && replaceExisting !== false) {
          const nextItems = { ...stateWithAsset.undoableState.items, [finalItemId]: captionItem };
          nextState = {
            ...stateWithAsset,
            undoableState: {
              ...stateWithAsset.undoableState,
              items: nextItems,
            },
            selectedItems: [finalItemId],
          };
          result = {
            captionItemId: finalItemId,
            captionAssetId: captionAsset.id,
            replacedItemId: existingCaption.id,
            appliedStyle: resolvedStyle,
            editorState: nextState,
          };
        } else {
          nextState = addItem({
            state: stateWithAsset,
            item: captionItem,
            select: true,
            position: startPosition,
          });
          result = {
            captionItemId: finalItemId,
            captionAssetId: captionAsset.id,
            appliedStyle: resolvedStyle,
            editorState: nextState,
          };
        }

        setState({
          commitToUndoStack: true,
          update: nextState,
        });

        return result;
      } catch (error) {
        console.error('[useAddCaptionItemForMultipleTargets] Error while adding caption:', error);
        return null;
      }
    },
    [compositionHeight, compositionWidth, fps, setState, stateRef],
  );
};

export type { AddCaptionItemParams, AddCaptionItemResult, CaptionTargetItem };
