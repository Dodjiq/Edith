'use client';

import { useCallback, useEffect } from 'react';
import type { FC, RefObject } from 'react';
import type { PlayerRef } from '@remotion/player';
import {
  EditorRealtimePayload,
  editorToolNames,
  EditorRemoveSilencesPayload,
  EditorSelectTimelineItemsPayload,
  EditorPlaceLibraryAssetsOnTimelinePayload,
  EditorPlaceTimelineItemsPayload,
  EditorSetCaptionsPayload,
  EditorAddTextItemsPayload,
  EditorUpdateTextItemsPayload,
  EditorAddImageItemsPayload,
  EditorUpdateImageItemsPayload,
  EditorAddShapeItemsPayload,
  EditorUpdateShapeItemsPayload,
  EditorAddMotionDesignItemsPayload,
  EditorUpdateMotionDesignItemsPayload,
  EditorGetProjectStatePayload,
  EditorGetItemsDataPayload,
  EditorGetLibraryAssetsDataPayload,
  EditorDeleteItemsPayload,
  EditorTrimTimelineItemsPayload,
  EditorCutFrameRangePayload,
  EditorGetTranscriptionPayload,
  EditorGetDetailedTranscriptionPayload,
  CaptionStyleInput,
  FrameRange,
  RealtimeMessage,
  realtimeMessageTypes,
} from 'api-types';
import { useWebSocket } from '@/app/WebSocketProvider';
import { useSelectTimelineItems } from '../hooks/use-select-timeline-item';
import { usePlaceLibraryAssetsOnTimeline } from '../hooks/use-place-library-assets-on-timeline';
import { usePlaceTimelineItems } from '../hooks/use-place-timeline-items';
import { RemoveSilenceOptions, useRemoveSilences } from '../hooks/use-remove-silences';
import { useSetCaptionsFromTool } from '../hooks/use-set-captions';
import { useAddTextItems } from '../hooks/use-add-text-items';
import { useUpdateTextItems } from '../hooks/use-update-text-items';
import { useAddImageItems } from '../hooks/use-add-image-items';
import { useUpdateImageItems } from '../hooks/use-update-image-items';
import { useAddShapeItems } from '../hooks/use-add-shape-items';
import { useUpdateShapeItems } from '../hooks/use-update-shape-items';
import { useAddMotionDesignItems } from '../hooks/use-add-motion-design-items';
import { useUpdateMotionDesignItems } from '../hooks/use-update-motion-design-items';
import { useGetProjectState } from '../hooks/use-get-project-state';
import { useGetItemsData } from '../hooks/use-get-items-data';
import { useGetLibraryAssetsData } from '../hooks/use-get-library-assets-data';
import { useDeleteItems } from '../hooks/use-delete-items';
import { useTrimTimelineItems } from '../hooks/use-trim-timeline-items';
import { useCutFrameRange } from '../hooks/use-cut-frame-range';
import { useGetTranscription } from '../hooks/use-get-transcription';
import { isAddMotionDesignItemsPayload, isUpdateMotionDesignItemsPayload } from './motion-design-realtime-guards';
import { isAddShapeItemsPayload, isUpdateShapeItemsPayload } from './shape-realtime-guards';

const isSelectTimelineItemsPayload = (payload: unknown): payload is EditorSelectTimelineItemsPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const casted = payload as Partial<EditorRealtimePayload>;

  if (casted.tool_name !== editorToolNames.selectTimelineItems) {
    return false;
  }

  const selectPayload = casted as Partial<EditorSelectTimelineItemsPayload>;
  const itemIds = selectPayload.params?.itemIds;

  return Array.isArray(itemIds) && itemIds.every((id) => typeof id === 'string');
};

const isPlaceLibraryAssetsOnTimelinePayload = (
  payload: unknown,
): payload is EditorPlaceLibraryAssetsOnTimelinePayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const casted = payload as Partial<EditorPlaceLibraryAssetsOnTimelinePayload>;
  if (casted.tool_name !== editorToolNames.placeLibraryAssetsOnTimeline) {
    return false;
  }

  const params = casted.params as Record<string, unknown> | undefined;
  if (!params || typeof params !== 'object') {
    return false;
  }

  const { libraryAssetIds, trackId, startFrame, startTimeInSeconds, afterItemId } = params;

  const isValidIds =
    Array.isArray(libraryAssetIds) &&
    libraryAssetIds.length > 0 &&
    libraryAssetIds.every((id) => typeof id === 'string');

  const isValidTrackId = trackId === undefined || typeof trackId === 'string';

  const isValidStartFrame =
    startFrame === undefined || (typeof startFrame === 'number' && Number.isInteger(startFrame) && startFrame >= 0);

  const isValidStartTime =
    startTimeInSeconds === undefined || (typeof startTimeInSeconds === 'number' && startTimeInSeconds >= 0);

  const isValidAfterItemId = afterItemId === undefined || typeof afterItemId === 'string';

  return isValidIds && isValidTrackId && isValidStartFrame && isValidStartTime && isValidAfterItemId;
};

const isPlaceTimelineItemsPayload = (payload: unknown): payload is EditorPlaceTimelineItemsPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const casted = payload as Partial<EditorPlaceTimelineItemsPayload>;
  if (casted.tool_name !== editorToolNames.placeTimelineItems) {
    return false;
  }

  const params = casted.params as Record<string, unknown> | undefined;
  if (!params || typeof params !== 'object') {
    return false;
  }

  const { itemIds, trackId, startFrame, startTimeInSeconds, afterItemId } = params;

  const isValidIds = Array.isArray(itemIds) && itemIds.length > 0 && itemIds.every((id) => typeof id === 'string');
  const isValidTrackId = trackId === undefined || typeof trackId === 'string';
  const isValidStartFrame =
    startFrame === undefined || (typeof startFrame === 'number' && Number.isInteger(startFrame) && startFrame >= 0);
  const isValidStartTime =
    startTimeInSeconds === undefined || (typeof startTimeInSeconds === 'number' && startTimeInSeconds >= 0);
  const isValidAfterItemId = afterItemId === undefined || typeof afterItemId === 'string';

  return isValidIds && isValidTrackId && isValidStartFrame && isValidStartTime && isValidAfterItemId;
};

const isRemoveSilencesPayload = (payload: unknown): payload is EditorRemoveSilencesPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const casted = payload as Partial<EditorRemoveSilencesPayload>;
  const params = casted.params;

  if (!params || typeof params !== 'object') {
    return false;
  }

  const { targetItemId, noiseThresholdInDecibels, minDurationInSeconds, paddingInSeconds, detectionsByItemId } =
    params as Record<string, unknown>;

  const isValidNumberOrUndefined = (value: unknown) => typeof value === 'number' || value === undefined;
  const isTimeRange = (value: unknown) => {
    if (!value || typeof value !== 'object') return false;
    const range = value as Record<string, unknown>;
    return typeof range.startInSeconds === 'number' && typeof range.endInSeconds === 'number';
  };

  const isDetectionSummary = (value: unknown) => {
    if (!value || typeof value !== 'object') return false;
    const detection = value as Record<string, unknown>;
    const audibleParts = detection.audibleParts as unknown;
    const silentParts = detection.silentParts as unknown;
    return (
      Array.isArray(audibleParts) &&
      Array.isArray(silentParts) &&
      audibleParts.every(isTimeRange) &&
      silentParts.every(isTimeRange) &&
      typeof detection.durationInSeconds === 'number'
    );
  };

  const isValidDetectionsMap = (value: unknown) => {
    if (value === undefined) return true;
    if (!value || typeof value !== 'object') return false;
    return Object.values(value as Record<string, unknown>).every(isDetectionSummary);
  };

  return (
    casted.tool_name === editorToolNames.removeSilences &&
    (typeof targetItemId === 'string' || targetItemId === undefined) &&
    isValidNumberOrUndefined(noiseThresholdInDecibels) &&
    isValidNumberOrUndefined(minDurationInSeconds) &&
    isValidNumberOrUndefined(paddingInSeconds) &&
    isValidDetectionsMap(detectionsByItemId)
  );
};

const isCaptionStyleInput = (style: unknown): style is CaptionStyleInput => {
  if (!style || typeof style !== 'object') return false;

  const value = style as Record<string, unknown>;
  const isNumberOrUndefined = (input: unknown) => typeof input === 'number' || input === undefined;
  const isStringOrUndefined = (input: unknown) => typeof input === 'string' || input === undefined;
  const isStringOrNullOrUndefined = (input: unknown) =>
    typeof input === 'string' || input === null || input === undefined;

  const fontStyle = value.fontStyle as Record<string, unknown> | undefined;
  const hasValidFontStyle =
    fontStyle === undefined ||
    (typeof fontStyle === 'object' && isStringOrUndefined(fontStyle.variant) && isStringOrUndefined(fontStyle.weight));

  return (
    isNumberOrUndefined(value.left) &&
    isNumberOrUndefined(value.top) &&
    isNumberOrUndefined(value.width) &&
    isNumberOrUndefined(value.height) &&
    isNumberOrUndefined(value.opacity) &&
    isNumberOrUndefined(value.rotation) &&
    isStringOrUndefined(value.fontFamily) &&
    hasValidFontStyle &&
    isNumberOrUndefined(value.lineHeight) &&
    isNumberOrUndefined(value.letterSpacing) &&
    isNumberOrUndefined(value.fontSize) &&
    (value.align === undefined || ['left', 'center', 'right'].includes(value.align as string)) &&
    isStringOrUndefined(value.color) &&
    isStringOrNullOrUndefined(value.highlightColor) &&
    (value.direction === undefined || value.direction === 'ltr' || value.direction === 'rtl') &&
    isNumberOrUndefined(value.pageDurationInMilliseconds) &&
    isNumberOrUndefined(value.captionStartInSeconds) &&
    isNumberOrUndefined(value.strokeWidth) &&
    isStringOrUndefined(value.strokeColor) &&
    isNumberOrUndefined(value.maxLines) &&
    isNumberOrUndefined(value.fadeInDurationInSeconds) &&
    isNumberOrUndefined(value.fadeOutDurationInSeconds)
  );
};

const isSetCaptionsPayload = (payload: unknown): payload is EditorSetCaptionsPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const casted = payload as Partial<EditorSetCaptionsPayload>;
  if (casted.tool_name !== editorToolNames.setCaptions) {
    return false;
  }

  const params = casted.params as Record<string, unknown> | undefined;
  if (!params || typeof params !== 'object') {
    return false;
  }

  const { targetItemId, targetItemIds, replaceExisting, style } = params;
  const isValidLegacyTarget = typeof targetItemId === 'string' || targetItemId === undefined;
  const isValidTargetIds =
    targetItemIds === undefined ||
    (Array.isArray(targetItemIds) && targetItemIds.every((id) => typeof id === 'string'));
  const isValidReplace = typeof replaceExisting === 'boolean' || replaceExisting === undefined;
  const isValidStyle = style === undefined || isCaptionStyleInput(style);

  return isValidLegacyTarget && isValidTargetIds && isValidReplace && isValidStyle;
};

const isTextItemPayload = (item: unknown): boolean => {
  if (!item || typeof item !== 'object') return false;

  const value = item as Record<string, unknown>;
  const style = value.style as Record<string, unknown> | undefined;
  const isNumberOrUndefined = (input: unknown) => typeof input === 'number' || input === undefined;
  const isStringOrUndefined = (input: unknown) => typeof input === 'string' || input === undefined;
  const fontStyle = style?.fontStyle as Record<string, unknown> | undefined;
  const hasValidFontStyle =
    fontStyle === undefined ||
    (typeof fontStyle === 'object' && isStringOrUndefined(fontStyle.variant) && isStringOrUndefined(fontStyle.weight));

  const hasValidStyle =
    style === undefined ||
    (typeof style === 'object' &&
      isNumberOrUndefined(style.left) &&
      isNumberOrUndefined(style.top) &&
      isNumberOrUndefined(style.width) &&
      isNumberOrUndefined(style.height) &&
      isNumberOrUndefined(style.opacity) &&
      isNumberOrUndefined(style.rotation) &&
      isStringOrUndefined(style.fontFamily) &&
      hasValidFontStyle &&
      isNumberOrUndefined(style.lineHeight) &&
      isNumberOrUndefined(style.letterSpacing) &&
      isNumberOrUndefined(style.fontSize) &&
      (style.align === undefined || ['left', 'center', 'right'].includes(style.align as string)) &&
      isStringOrUndefined(style.color) &&
      (style.direction === undefined || style.direction === 'ltr' || style.direction === 'rtl') &&
      isNumberOrUndefined(style.strokeWidth) &&
      isStringOrUndefined(style.strokeColor) &&
      isNumberOrUndefined(style.fadeInDurationInSeconds) &&
      isNumberOrUndefined(style.fadeOutDurationInSeconds));

  return (
    typeof value.text === 'string' &&
    value.text.trim().length > 0 &&
    isNumberOrUndefined(value.startFrame) &&
    isNumberOrUndefined(value.startTimeInSeconds) &&
    isNumberOrUndefined(value.durationInFrames) &&
    isNumberOrUndefined(value.durationInSeconds) &&
    isNumberOrUndefined(value.xOnCanvas) &&
    isNumberOrUndefined(value.yOnCanvas) &&
    hasValidStyle
  );
};

const isAddTextItemsPayload = (payload: unknown): payload is EditorAddTextItemsPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const casted = payload as Partial<EditorAddTextItemsPayload>;
  if (casted.tool_name !== editorToolNames.addTextItems) {
    return false;
  }

  const params = casted.params as Record<string, unknown> | undefined;
  if (!params || typeof params !== 'object') {
    return false;
  }

  const { items } = params;
  return Array.isArray(items) && items.length > 0 && items.every(isTextItemPayload);
};

const isTextPatchPayload = (patch: unknown): boolean => {
  if (!patch || typeof patch !== 'object') return false;

  const value = patch as Record<string, unknown>;
  const fontStyle = value.fontStyle as Record<string, unknown> | undefined;
  const isNumberOrUndefined = (input: unknown) => typeof input === 'number' || input === undefined;
  const isStringOrUndefined = (input: unknown) => typeof input === 'string' || input === undefined;
  const hasValidFontStyle =
    fontStyle === undefined ||
    (typeof fontStyle === 'object' && isStringOrUndefined(fontStyle.variant) && isStringOrUndefined(fontStyle.weight));

  return (
    isStringOrUndefined(value.text) &&
    isNumberOrUndefined(value.left) &&
    isNumberOrUndefined(value.top) &&
    isNumberOrUndefined(value.width) &&
    isNumberOrUndefined(value.height) &&
    isNumberOrUndefined(value.opacity) &&
    isNumberOrUndefined(value.rotation) &&
    isStringOrUndefined(value.fontFamily) &&
    hasValidFontStyle &&
    isNumberOrUndefined(value.lineHeight) &&
    isNumberOrUndefined(value.letterSpacing) &&
    isNumberOrUndefined(value.fontSize) &&
    (value.align === undefined || ['left', 'center', 'right'].includes(value.align as string)) &&
    isStringOrUndefined(value.color) &&
    (value.direction === undefined || value.direction === 'ltr' || value.direction === 'rtl') &&
    isNumberOrUndefined(value.strokeWidth) &&
    isStringOrUndefined(value.strokeColor) &&
    isNumberOrUndefined(value.fadeInDurationInSeconds) &&
    isNumberOrUndefined(value.fadeOutDurationInSeconds) &&
    isNumberOrUndefined(value.from) &&
    isNumberOrUndefined(value.durationInFrames) &&
    isNumberOrUndefined(value.startTimeInSeconds) &&
    isNumberOrUndefined(value.durationInSeconds) &&
    isNumberOrUndefined(value.xOnCanvas) &&
    isNumberOrUndefined(value.yOnCanvas)
  );
};

const isUpdateTextItemsPayload = (payload: unknown): payload is EditorUpdateTextItemsPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const casted = payload as Partial<EditorUpdateTextItemsPayload>;
  if (casted.tool_name !== editorToolNames.updateTextItems) {
    return false;
  }

  const params = casted.params as Record<string, unknown> | undefined;
  if (!params || typeof params !== 'object') {
    return false;
  }

  const { itemIds, patch, selectionBehavior } = params;
  const isValidIds = Array.isArray(itemIds) && itemIds.length > 0 && itemIds.every((id) => typeof id === 'string');
  const isValidSelection =
    selectionBehavior === undefined || ['select_updated', 'keep_current', 'none'].includes(selectionBehavior as string);

  return isValidIds && isTextPatchPayload(patch) && isValidSelection;
};

const isImageStylePayload = (style: unknown): boolean => {
  if (style === undefined) return true;
  if (!style || typeof style !== 'object') return false;

  const value = style as Record<string, unknown>;
  const isNumberOrUndefined = (input: unknown) => typeof input === 'number' || input === undefined;
  const isPositiveNumberOrUndefined = (input: unknown) =>
    input === undefined || (typeof input === 'number' && input > 0);

  return (
    isNumberOrUndefined(value.left) &&
    isNumberOrUndefined(value.top) &&
    isPositiveNumberOrUndefined(value.width) &&
    isPositiveNumberOrUndefined(value.height) &&
    isNumberOrUndefined(value.opacity) &&
    isNumberOrUndefined(value.rotation) &&
    isNumberOrUndefined(value.borderRadius) &&
    (value.keepAspectRatio === undefined || typeof value.keepAspectRatio === 'boolean') &&
    isNumberOrUndefined(value.fadeInDurationInSeconds) &&
    isNumberOrUndefined(value.fadeOutDurationInSeconds) &&
    (value.objectFit === undefined || ['contain', 'cover', 'fill'].includes(value.objectFit as string))
  );
};

const isImageItemPayload = (item: unknown): boolean => {
  if (!item || typeof item !== 'object') return false;

  const value = item as Record<string, unknown>;
  const isNumberOrUndefined = (input: unknown) => typeof input === 'number' || input === undefined;

  return (
    typeof value.assetId === 'string' &&
    value.assetId.trim().length > 0 &&
    isNumberOrUndefined(value.startFrame) &&
    isNumberOrUndefined(value.startTimeInSeconds) &&
    isNumberOrUndefined(value.durationInFrames) &&
    isNumberOrUndefined(value.durationInSeconds) &&
    isNumberOrUndefined(value.xOnCanvas) &&
    isNumberOrUndefined(value.yOnCanvas) &&
    isImageStylePayload(value.style)
  );
};

const isAddImageItemsPayload = (payload: unknown): payload is EditorAddImageItemsPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const casted = payload as Partial<EditorAddImageItemsPayload>;
  if (casted.tool_name !== editorToolNames.addImageItems) {
    return false;
  }

  const params = casted.params as Record<string, unknown> | undefined;
  if (!params || typeof params !== 'object') {
    return false;
  }

  const { items } = params;
  return Array.isArray(items) && items.length > 0 && items.every(isImageItemPayload);
};

const isUpdateImageItemsPayload = (payload: unknown): payload is EditorUpdateImageItemsPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const casted = payload as Partial<EditorUpdateImageItemsPayload>;
  if (casted.tool_name !== editorToolNames.updateImageItems) {
    return false;
  }

  const params = casted.params as Record<string, unknown> | undefined;
  if (!params || typeof params !== 'object') {
    return false;
  }

  const { itemIds, patch, selectionBehavior } = params;
  const patchValue = patch as Record<string, unknown> | undefined;
  const isNumberOrUndefined = (input: unknown) => typeof input === 'number' || input === undefined;
  const isValidSelection =
    selectionBehavior === undefined || ['select_updated', 'keep_current', 'none'].includes(selectionBehavior as string);
  const isValidPatch =
    patchValue !== undefined &&
    isImageStylePayload(patchValue) &&
    (patchValue.assetId === undefined || typeof patchValue.assetId === 'string') &&
    isNumberOrUndefined(patchValue.from) &&
    isNumberOrUndefined(patchValue.startTimeInSeconds) &&
    isNumberOrUndefined(patchValue.durationInFrames) &&
    isNumberOrUndefined(patchValue.durationInSeconds) &&
    isNumberOrUndefined(patchValue.xOnCanvas) &&
    isNumberOrUndefined(patchValue.yOnCanvas);

  return (
    Array.isArray(itemIds) &&
    itemIds.length > 0 &&
    itemIds.every((id) => typeof id === 'string') &&
    isValidPatch &&
    isValidSelection
  );
};

const isGetProjectStatePayload = (payload: unknown): payload is EditorGetProjectStatePayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const casted = payload as Partial<EditorGetProjectStatePayload>;
  return casted.tool_name === editorToolNames.getProjectState;
};

const isGetItemsDataPayload = (payload: unknown): payload is EditorGetItemsDataPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const casted = payload as Partial<EditorGetItemsDataPayload>;
  if (casted.tool_name !== editorToolNames.getItemsData) {
    return false;
  }

  const params = casted.params as Record<string, unknown> | undefined;
  if (!params || typeof params !== 'object') {
    return false;
  }

  const { itemIds } = params;
  return Array.isArray(itemIds) && itemIds.every((id) => typeof id === 'string');
};

const isGetLibraryAssetsDataPayload = (payload: unknown): payload is EditorGetLibraryAssetsDataPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const casted = payload as Partial<EditorGetLibraryAssetsDataPayload>;
  return casted.tool_name === editorToolNames.getLibraryAssetsData;
};

const isDeleteItemsPayload = (payload: unknown): payload is EditorDeleteItemsPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const casted = payload as Partial<EditorDeleteItemsPayload>;
  if (casted.tool_name !== editorToolNames.deleteItems) {
    return false;
  }

  const params = casted.params as Record<string, unknown> | undefined;
  if (!params || typeof params !== 'object') {
    return false;
  }

  const { itemIds } = params;
  return Array.isArray(itemIds) && itemIds.every((id) => typeof id === 'string');
};

const isValidFrameRange = (range: unknown): boolean => {
  if (!range || typeof range !== 'object') return false;
  const r = range as Record<string, unknown>;
  return (
    typeof r.startFrame === 'number' &&
    typeof r.endFrame === 'number' &&
    Number.isInteger(r.startFrame) &&
    Number.isInteger(r.endFrame) &&
    r.startFrame >= 0 &&
    r.endFrame > r.startFrame
  );
};

const isCutFrameRangePayload = (payload: unknown): payload is EditorCutFrameRangePayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const casted = payload as Partial<EditorCutFrameRangePayload>;
  if (casted.tool_name !== editorToolNames.cutFrameRange) {
    return false;
  }

  const params = casted.params as Record<string, unknown> | undefined;
  if (!params || typeof params !== 'object') {
    return false;
  }

  const { trackId, ranges } = params;
  return typeof trackId === 'string' && Array.isArray(ranges) && ranges.length > 0 && ranges.every(isValidFrameRange);
};

const isTrimTimelineItemsPayload = (payload: unknown): payload is EditorTrimTimelineItemsPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const casted = payload as Partial<EditorTrimTimelineItemsPayload>;
  if (casted.tool_name !== editorToolNames.trimTimelineItems) {
    return false;
  }

  const params = casted.params as Record<string, unknown> | undefined;
  if (!params || typeof params !== 'object') {
    return false;
  }

  const { itemIds, mode, durationInFrames, durationInSeconds } = params;
  const isValidMode = mode === undefined || mode === 'first_half' || mode === 'duration';
  const isValidDurationInFrames =
    durationInFrames === undefined || (typeof durationInFrames === 'number' && Number.isInteger(durationInFrames));
  const isValidDurationInSeconds = durationInSeconds === undefined || typeof durationInSeconds === 'number';

  return (
    Array.isArray(itemIds) &&
    itemIds.length > 0 &&
    itemIds.every((id) => typeof id === 'string') &&
    isValidMode &&
    isValidDurationInFrames &&
    isValidDurationInSeconds
  );
};

const isGetTranscriptionPayload = (payload: unknown): payload is EditorGetTranscriptionPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const casted = payload as Partial<EditorGetTranscriptionPayload>;
  if (casted.tool_name !== editorToolNames.getTranscription) {
    return false;
  }

  const params = casted.params as Record<string, unknown> | undefined;
  if (!params || typeof params !== 'object') {
    return false;
  }

  const { itemIds, startFrame, endFrame } = params;
  // itemIds is optional, but if present must be an array of strings
  const isValidItemIds =
    itemIds === undefined || (Array.isArray(itemIds) && itemIds.every((id) => typeof id === 'string'));
  // startFrame and endFrame are optional, but if present must be non-negative integers
  const isValidStartFrame =
    startFrame === undefined || (typeof startFrame === 'number' && Number.isInteger(startFrame) && startFrame >= 0);
  const isValidEndFrame =
    endFrame === undefined || (typeof endFrame === 'number' && Number.isInteger(endFrame) && endFrame > 0);

  return isValidItemIds && isValidStartFrame && isValidEndFrame;
};

const isGetDetailedTranscriptionPayload = (payload: unknown): payload is EditorGetDetailedTranscriptionPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const casted = payload as Partial<EditorGetDetailedTranscriptionPayload>;
  if (casted.tool_name !== editorToolNames.getDetailedTranscription) {
    return false;
  }

  const params = casted.params as Record<string, unknown> | undefined;
  if (!params || typeof params !== 'object') {
    return false;
  }

  const { minutes, itemIds } = params;
  // minutes is required and limited to 10 non-negative integers
  const isValidMinutes =
    Array.isArray(minutes) &&
    minutes.length > 0 &&
    minutes.length <= 10 &&
    minutes.every((m) => typeof m === 'number' && Number.isInteger(m) && m >= 0);
  // itemIds is optional, but if present must be an array of strings
  const isValidItemIds =
    itemIds === undefined || (Array.isArray(itemIds) && itemIds.every((id) => typeof id === 'string'));

  return isValidMinutes && isValidItemIds;
};

type EditorRealtimeDispatcherOptions = {
  onSelectTimelineItems: (itemIds: string[]) => void;
  onPlaceLibraryAssetsOnTimeline: (
    params: EditorPlaceLibraryAssetsOnTimelinePayload['params'] & { toolCallId?: string },
  ) => void;
  onPlaceTimelineItems: (params: EditorPlaceTimelineItemsPayload['params'] & { toolCallId?: string }) => void;
  onRemoveSilences: (params: RemoveSilenceOptions) => void;
  onSetCaptions: (params: EditorSetCaptionsPayload['params'] & { toolCallId?: string }) => void;
  onAddTextItems: (params: EditorAddTextItemsPayload['params'] & { toolCallId?: string }) => void;
  onUpdateTextItems: (params: EditorUpdateTextItemsPayload['params'] & { toolCallId?: string }) => void;
  onAddImageItems: (params: EditorAddImageItemsPayload['params'] & { toolCallId?: string }) => void;
  onUpdateImageItems: (params: EditorUpdateImageItemsPayload['params'] & { toolCallId?: string }) => void;
  onAddShapeItems: (params: EditorAddShapeItemsPayload['params'] & { toolCallId?: string }) => void;
  onUpdateShapeItems: (params: EditorUpdateShapeItemsPayload['params'] & { toolCallId?: string }) => void;
  onAddMotionDesignItems: (params: EditorAddMotionDesignItemsPayload['params'] & { toolCallId?: string }) => void;
  onUpdateMotionDesignItems: (params: EditorUpdateMotionDesignItemsPayload['params'] & { toolCallId?: string }) => void;
  onGetProjectState: (params: { toolCallId?: string }) => void;
  onGetItemsData: (params: { itemIds: string[]; toolCallId?: string }) => void;
  onGetLibraryAssetsData: (params: { toolCallId?: string }) => void;
  onDeleteItems: (params: { itemIds: string[]; toolCallId?: string }) => void;
  onTrimTimelineItems: (params: EditorTrimTimelineItemsPayload['params'] & { toolCallId?: string }) => void;
  onCutFrameRange: (params: { trackId: string; ranges: FrameRange[]; toolCallId?: string }) => void;
  onGetTranscription: (params: {
    itemIds?: string[];
    startFrame?: number;
    endFrame?: number;
    toolCallId?: string;
  }) => void;
  onGetDetailedTranscription: (params: { minutes: number[]; itemIds?: string[]; toolCallId?: string }) => void;
};

export const useEditorRealtimeDispatcher = ({
  onSelectTimelineItems,
  onPlaceLibraryAssetsOnTimeline,
  onPlaceTimelineItems,
  onRemoveSilences,
  onSetCaptions,
  onAddTextItems,
  onUpdateTextItems,
  onAddImageItems,
  onUpdateImageItems,
  onAddShapeItems,
  onUpdateShapeItems,
  onAddMotionDesignItems,
  onUpdateMotionDesignItems,
  onGetProjectState,
  onGetItemsData,
  onGetLibraryAssetsData,
  onDeleteItems,
  onTrimTimelineItems,
  onCutFrameRange,
  onGetTranscription,
  onGetDetailedTranscription,
}: EditorRealtimeDispatcherOptions): void => {
  const { registerHandler } = useWebSocket();

  const handleMessage = useCallback(
    (message: RealtimeMessage<unknown>) => {
      const payload = message.payload;

      if (isSelectTimelineItemsPayload(payload)) {
        onSelectTimelineItems(payload.params.itemIds);
        return;
      }

      if (isPlaceLibraryAssetsOnTimelinePayload(payload)) {
        onPlaceLibraryAssetsOnTimeline({ ...payload.params, toolCallId: payload.toolCallId });
        return;
      }

      if (isPlaceTimelineItemsPayload(payload)) {
        onPlaceTimelineItems({ ...payload.params, toolCallId: payload.toolCallId });
        return;
      }

      if (isRemoveSilencesPayload(payload)) {
        onRemoveSilences({ ...payload.params, toolCallId: payload.toolCallId });
        return;
      }

      if (isSetCaptionsPayload(payload)) {
        onSetCaptions({ ...payload.params, toolCallId: payload.toolCallId });
        return;
      }

      if (isAddTextItemsPayload(payload)) {
        onAddTextItems({ ...payload.params, toolCallId: payload.toolCallId });
        return;
      }

      if (isUpdateTextItemsPayload(payload)) {
        onUpdateTextItems({ ...payload.params, toolCallId: payload.toolCallId });
        return;
      }

      if (isAddImageItemsPayload(payload)) {
        onAddImageItems({ ...payload.params, toolCallId: payload.toolCallId });
        return;
      }

      if (isUpdateImageItemsPayload(payload)) {
        onUpdateImageItems({ ...payload.params, toolCallId: payload.toolCallId });
        return;
      }

      if (isAddShapeItemsPayload(payload)) {
        onAddShapeItems({ ...payload.params, toolCallId: payload.toolCallId });
        return;
      }

      if (isUpdateShapeItemsPayload(payload)) {
        onUpdateShapeItems({ ...payload.params, toolCallId: payload.toolCallId });
        return;
      }

      if (isAddMotionDesignItemsPayload(payload)) {
        onAddMotionDesignItems({ ...payload.params, toolCallId: payload.toolCallId });
        return;
      }

      if (isUpdateMotionDesignItemsPayload(payload)) {
        onUpdateMotionDesignItems({ ...payload.params, toolCallId: payload.toolCallId });
        return;
      }

      if (isGetProjectStatePayload(payload)) {
        onGetProjectState({ toolCallId: payload.toolCallId });
        return;
      }

      if (isGetItemsDataPayload(payload)) {
        onGetItemsData({ itemIds: payload.params.itemIds, toolCallId: payload.toolCallId });
        return;
      }

      if (isGetLibraryAssetsDataPayload(payload)) {
        onGetLibraryAssetsData({ toolCallId: payload.toolCallId });
        return;
      }

      if (isDeleteItemsPayload(payload)) {
        onDeleteItems({ itemIds: payload.params.itemIds, toolCallId: payload.toolCallId });
        return;
      }

      if (isTrimTimelineItemsPayload(payload)) {
        onTrimTimelineItems({ ...payload.params, toolCallId: payload.toolCallId });
        return;
      }

      if (isCutFrameRangePayload(payload)) {
        onCutFrameRange({
          trackId: payload.params.trackId,
          ranges: payload.params.ranges,
          toolCallId: payload.toolCallId,
        });
        return;
      }

      if (isGetTranscriptionPayload(payload)) {
        onGetTranscription({
          itemIds: payload.params.itemIds,
          startFrame: payload.params.startFrame,
          endFrame: payload.params.endFrame,
          toolCallId: payload.toolCallId,
        });
        return;
      }

      if (isGetDetailedTranscriptionPayload(payload)) {
        onGetDetailedTranscription({
          minutes: payload.params.minutes,
          itemIds: payload.params.itemIds,
          toolCallId: payload.toolCallId,
        });
        return;
      }
    },
    [
      onPlaceTimelineItems,
      onPlaceLibraryAssetsOnTimeline,
      onCutFrameRange,
      onDeleteItems,
      onTrimTimelineItems,
      onGetDetailedTranscription,
      onGetItemsData,
      onGetLibraryAssetsData,
      onGetProjectState,
      onGetTranscription,
      onRemoveSilences,
      onSelectTimelineItems,
      onSetCaptions,
      onAddTextItems,
      onUpdateTextItems,
      onAddImageItems,
      onUpdateImageItems,
      onAddShapeItems,
      onUpdateShapeItems,
      onAddMotionDesignItems,
      onUpdateMotionDesignItems,
    ],
  );

  useEffect(() => {
    return registerHandler(realtimeMessageTypes.editor, handleMessage);
  }, [handleMessage, registerHandler]);
};

export const EditorRealtimeBridge: FC<{ playerRef?: RefObject<PlayerRef | null> }> = ({ playerRef }) => {
  const selectTimelineItems = useSelectTimelineItems();
  const { placeLibraryAssetsOnTimeline } = usePlaceLibraryAssetsOnTimeline();
  const { placeTimelineItems } = usePlaceTimelineItems();
  const { removeSilences } = useRemoveSilences();
  const { setCaptions } = useSetCaptionsFromTool();
  const { addTextItems } = useAddTextItems(playerRef);
  const { updateTextItems } = useUpdateTextItems(playerRef);
  const { addImageItems } = useAddImageItems(playerRef);
  const { updateImageItems } = useUpdateImageItems(playerRef);
  const { addShapeItems } = useAddShapeItems(playerRef);
  const { updateShapeItems } = useUpdateShapeItems(playerRef);
  const { addMotionDesignItems } = useAddMotionDesignItems(playerRef);
  const { updateMotionDesignItems } = useUpdateMotionDesignItems(playerRef);
  const { getProjectState } = useGetProjectState(playerRef);
  const { getItemsData } = useGetItemsData();
  const { getLibraryAssetsData } = useGetLibraryAssetsData();
  const { deleteItems } = useDeleteItems();
  const { trimTimelineItems } = useTrimTimelineItems();
  const { cutFrameRange } = useCutFrameRange();
  const { getTranscription, getDetailedTranscription } = useGetTranscription();

  useEditorRealtimeDispatcher({
    onSelectTimelineItems: selectTimelineItems,
    onPlaceLibraryAssetsOnTimeline: (params) => {
      placeLibraryAssetsOnTimeline(params);
    },
    onPlaceTimelineItems: (params) => {
      placeTimelineItems(params);
    },
    onRemoveSilences: (params) => {
      removeSilences(params);
    },
    onSetCaptions: (params) => {
      setCaptions(params);
    },
    onAddTextItems: (params) => {
      addTextItems(params);
    },
    onUpdateTextItems: (params) => {
      updateTextItems(params);
    },
    onAddImageItems: (params) => {
      addImageItems(params);
    },
    onUpdateImageItems: (params) => {
      updateImageItems(params);
    },
    onAddShapeItems: (params) => {
      addShapeItems(params);
    },
    onUpdateShapeItems: (params) => {
      updateShapeItems(params);
    },
    onAddMotionDesignItems: (params) => {
      addMotionDesignItems(params);
    },
    onUpdateMotionDesignItems: (params) => {
      updateMotionDesignItems(params);
    },
    onGetProjectState: (params) => {
      getProjectState(params);
    },
    onGetItemsData: (params) => {
      getItemsData(params);
    },
    onGetLibraryAssetsData: (params) => {
      getLibraryAssetsData(params);
    },
    onDeleteItems: (params) => {
      deleteItems(params);
    },
    onTrimTimelineItems: (params) => {
      trimTimelineItems(params);
    },
    onCutFrameRange: (params) => {
      cutFrameRange(params);
    },
    onGetTranscription: (params) => {
      getTranscription(params);
    },
    onGetDetailedTranscription: (params) => {
      getDetailedTranscription(params);
    },
  });

  return null;
};
