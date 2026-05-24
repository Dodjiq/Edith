import { useCallback } from 'react';
import { editorToolNames, EditorSetCaptionsPayload, CaptionStyleInput, CaptionEdit, Caption } from 'api-types';
import { toast } from 'sonner';
import api from '@/utils/services/api-frontend';
import { generateRandomId } from '../utils/generate-random-id';
import {
  findExistingCaptionForTarget,
  useAddCaptionItem,
  useAddCaptionItemForMultipleTargets,
} from './use-add-caption-item';
import { useAllItems, useAssets, useFps, useSelectedItems, useTracks, useWriteContext } from '../utils/use-context';
import { AudioItem } from '../items/audio/audio-item-type';
import { VideoItem } from '../items/video/video-item-type';
import { CaptionsItem } from '../items/captions/captions-item-type';
import { AudioAsset, CaptionAsset, VideoAsset } from '../assets/assets';
import { periodicallyCheckIfLocalUrlIsStillValid, getLocalUrls, useLocalUrls } from '../caching/load-to-blob-url';
import { getCaptions, getCaptionsFromBuffer } from '../captioning/caption-state';
import { validateFontStyle } from '../utils/text/validate-font-weight';
import { mixTimelineAudio } from '../captioning/mix-timeline-audio';
import { useGetProjectState } from './use-get-project-state';
import { EditorState } from '../state/types';

type CaptionableItem = VideoItem | AudioItem;
type CaptionableAsset = VideoAsset | AudioAsset;

type SetCaptionsRequest = Omit<EditorSetCaptionsPayload['params'], 'targetItemId'> & {
  /** @deprecated Use targetItemIds instead */
  targetItemId?: string;
  toolCallId?: string;
};

const resolveCaptionStyleFromOverrides = (
  existingItem: CaptionsItem,
  overrides?: CaptionStyleInput,
): Partial<CaptionsItem> => {
  if (!overrides) return {};

  const updates: Partial<CaptionsItem> = {};

  if (overrides.left !== undefined) updates.left = overrides.left;
  if (overrides.top !== undefined) updates.top = overrides.top;
  if (overrides.width !== undefined) updates.width = overrides.width;
  if (overrides.height !== undefined) updates.height = overrides.height;
  if (overrides.opacity !== undefined) updates.opacity = overrides.opacity;
  if (overrides.rotation !== undefined) updates.rotation = overrides.rotation;
  if (overrides.fontFamily !== undefined) updates.fontFamily = overrides.fontFamily;
  if (overrides.fontSize !== undefined) updates.fontSize = overrides.fontSize;
  if (overrides.lineHeight !== undefined) updates.lineHeight = overrides.lineHeight;
  if (overrides.letterSpacing !== undefined) updates.letterSpacing = overrides.letterSpacing;
  if (overrides.align !== undefined) updates.align = overrides.align;
  if (overrides.color !== undefined) updates.color = overrides.color;
  if (overrides.highlightColor !== undefined) updates.highlightColor = overrides.highlightColor ?? existingItem.color;
  if (overrides.direction !== undefined) updates.direction = overrides.direction;
  if (overrides.pageDurationInMilliseconds !== undefined)
    updates.pageDurationInMilliseconds = overrides.pageDurationInMilliseconds;
  if (overrides.captionStartInSeconds !== undefined) updates.captionStartInSeconds = overrides.captionStartInSeconds;
  if (overrides.strokeWidth !== undefined) updates.strokeWidth = overrides.strokeWidth;
  if (overrides.strokeColor !== undefined) updates.strokeColor = overrides.strokeColor;
  if (overrides.maxLines !== undefined) updates.maxLines = overrides.maxLines;
  if (overrides.fadeInDurationInSeconds !== undefined)
    updates.fadeInDurationInSeconds = overrides.fadeInDurationInSeconds;
  if (overrides.fadeOutDurationInSeconds !== undefined)
    updates.fadeOutDurationInSeconds = overrides.fadeOutDurationInSeconds;

  if (overrides.fontStyle || overrides.fontFamily) {
    // Determine the font family to validate against
    const targetFontFamily = overrides.fontFamily ?? existingItem.fontFamily;
    const requestedVariant = overrides.fontStyle?.variant ?? existingItem.fontStyle.variant;
    const requestedWeight = overrides.fontStyle?.weight ?? existingItem.fontStyle.weight;

    // Validate and correct font style to ensure it's supported by the font
    const validatedStyle = validateFontStyle(targetFontFamily, requestedWeight, requestedVariant);

    updates.fontStyle = {
      variant: validatedStyle.variant,
      weight: validatedStyle.weight,
    };
  }

  return updates;
};

export const useSetCaptionsFromTool = () => {
  const { items } = useAllItems();
  const { assets } = useAssets();
  const { selectedItems } = useSelectedItems();
  const { tracks } = useTracks();
  const { fps } = useFps();
  const { setState } = useWriteContext();
  const localUrls = useLocalUrls();
  const addCaptionItem = useAddCaptionItem();
  const addCaptionItemForMultipleTargets = useAddCaptionItemForMultipleTargets();
  const { mutateAsync: reportToolResult } = api.tools.reportToolResult.useMutation();
  const { buildProjectState } = useGetProjectState();

  /** Resolve multiple target items from IDs, sorted by timeline position */
  const resolveTargetItems = useCallback(
    (targetItemIds?: string[]): CaptionableItem[] => {
      const resolved: CaptionableItem[] = [];

      if (targetItemIds && targetItemIds.length > 0) {
        for (const id of targetItemIds) {
          const item = items[id];
          if (item && (item.type === 'video' || item.type === 'audio')) {
            resolved.push(item);
          }
        }
      } else {
        // Fallback to selected items
        for (const id of selectedItems) {
          const item = items[id];
          if (item && (item.type === 'video' || item.type === 'audio')) {
            resolved.push(item);
          }
        }
      }

      // Sort by timeline position (item.from)
      return resolved.sort((a, b) => a.from - b.from);
    },
    [items, selectedItems],
  );

  const resolveCaptionItem = useCallback(
    (targetItemId?: string): CaptionsItem | null => {
      if (!targetItemId) return null;
      const item = items[targetItemId];
      if (item && item.type === 'captions') {
        return item;
      }
      return null;
    },
    [items],
  );

  const resolveAsset = useCallback(
    (item: CaptionableItem): CaptionableAsset | null => {
      const asset = assets[item.assetId];
      if (!asset) return null;
      if (asset.type === 'audio' || asset.type === 'video') {
        return asset;
      }
      return null;
    },
    [assets],
  );

  const resolveSourceUrl = useCallback(
    (asset: CaptionableAsset): string | null => {
      const localUrl = localUrls[asset.id];
      if (localUrl) {
        void periodicallyCheckIfLocalUrlIsStillValid(localUrl, asset);
        return localUrl;
      }

      return asset.remoteUrl;
    },
    [localUrls],
  );

  /** Check if an asset has cached transcription from upload */
  const getCachedTranscription = useCallback((asset: CaptionableAsset): Caption[] | null => {
    if (asset.transcription && asset.transcription.length > 0) {
      // The transcription is already in Remotion format with leading spaces
      return asset.transcription.map((c) => ({
        text: c.text,
        startMs: c.startMs,
        endMs: c.endMs,
        timestampMs: c.timestampMs ?? null,
        confidence: c.confidence ?? null,
      }));
    }
    return null;
  }, []);

  const updateCaptionItemStyle = useCallback(
    (captionItem: CaptionsItem, styleOverrides: CaptionStyleInput | undefined): CaptionsItem => {
      const updates = resolveCaptionStyleFromOverrides(captionItem, styleOverrides);
      return { ...captionItem, ...updates };
    },
    [],
  );

  const applyCaptionEdits = useCallback(
    (captions: Caption[], edits: CaptionEdit[]): { updatedCaptions: Caption[]; editedIndices: number[] } => {
      const updatedCaptions = [...captions];
      const editedIndices: number[] = [];

      for (const edit of edits) {
        if (edit.index < 0 || edit.index >= updatedCaptions.length) continue;

        const original = updatedCaptions[edit.index];
        updatedCaptions[edit.index] = {
          ...original,
          text: edit.text ?? original.text,
          startMs: edit.startMs ?? original.startMs,
          endMs: edit.endMs ?? original.endMs,
        };
        editedIndices.push(edit.index);
      }

      return { updatedCaptions, editedIndices };
    },
    [],
  );

  const setCaptions = useCallback(
    async ({
      targetItemId,
      targetItemIds,
      replaceExisting = true,
      style,
      captionEdits,
      toolCallId,
    }: SetCaptionsRequest = {}) => {
      const report = async (status: 'success' | 'skipped' | 'error', payload?: Record<string, unknown>) => {
        if (!toolCallId) return;
        try {
          await reportToolResult({
            body: {
              toolCallId,
              toolName: editorToolNames.setCaptions,
              status,
              output: payload,
              error: status === 'error' ? (payload?.error as string | undefined) : undefined,
            },
          });
        } catch {
          // Reporting failure should not interrupt user flow
        }
      };

      // Convert legacy single targetItemId to array if provided
      const effectiveTargetItemIds = targetItemIds ?? (targetItemId ? [targetItemId] : undefined);

      // Check if targeting a caption item directly (style and/or text update)
      // Only check first item for caption type when single item is provided
      if (effectiveTargetItemIds?.length === 1) {
        const captionItem = resolveCaptionItem(effectiveTargetItemIds[0]);
        if (captionItem) {
          const captionAsset = assets[captionItem.assetId] as CaptionAsset | undefined;

          // Apply style updates to the item
          const updatedItem = updateCaptionItemStyle(captionItem, style);

          // Apply caption text edits if provided
          let updatedAsset: CaptionAsset | undefined;
          let editedIndices: number[] = [];

          if (captionEdits && captionEdits.length > 0 && captionAsset) {
            const editResult = applyCaptionEdits(captionAsset.captions, captionEdits);
            editedIndices = editResult.editedIndices;
            updatedAsset = {
              ...captionAsset,
              captions: editResult.updatedCaptions,
            };
          }

          let updatedState: EditorState | null = null;
          setState({
            commitToUndoStack: true,
            update: (prev) => {
              const nextState: EditorState = {
                ...prev,
                undoableState: {
                  ...prev.undoableState,
                  items: {
                    ...prev.undoableState.items,
                    [captionItem.id]: updatedItem,
                  },
                  assets: updatedAsset
                    ? {
                        ...prev.undoableState.assets,
                        [captionItem.assetId]: updatedAsset,
                      }
                    : prev.undoableState.assets,
                },
                selectedItems: [captionItem.id],
              };

              updatedState = nextState;
              return nextState;
            },
          });

          const hasStyleChanges = style && Object.keys(style).length > 0;
          const hasTextEdits = editedIndices.length > 0;
          const description = hasTextEdits
            ? `Edited ${editedIndices.length} caption(s)${hasStyleChanges ? ' and updated style' : ''}.`
            : 'Caption style has been updated.';

          toast.success('Captions updated', { description });

          await report('success', {
            mode: hasTextEdits ? 'text-edit' : 'style-update',
            captionItemId: captionItem.id,
            captionAssetId: captionItem.assetId,
            appliedStyle: style,
            editedCaptionIndices: editedIndices.length > 0 ? editedIndices : undefined,
            captionCount: updatedAsset?.captions?.length ?? captionAsset?.captions?.length ?? 0,
            projectState: buildProjectState(updatedState ?? undefined),
          });
          return;
        }
      }

      // Resolve target items (video/audio) - sorted by timeline position
      const targetItems = resolveTargetItems(effectiveTargetItemIds);

      if (targetItems.length === 0) {
        const error = effectiveTargetItemIds?.length
          ? `No captionable video/audio items found among the provided IDs.`
          : 'Select at least one video or audio item before using set_captions.';
        toast.error('Cannot set captions', { description: error });
        await report('error', { error, requestedItemIds: effectiveTargetItemIds });
        return;
      }

      // Multi-item path: mix audio from all items
      if (targetItems.length > 1) {
        try {
          toast.info('Mixing audio tracks', { description: `Processing ${targetItems.length} items...` });

          const mixedAudio = await mixTimelineAudio({
            items: targetItems,
            assets,
            localUrls: getLocalUrls(),
            fps,
          });

          const captionItemId = generateRandomId();
          const captions = await getCaptionsFromBuffer({
            audioBuffer: mixedAudio.buffer,
            audioMimeType: mixedAudio.mimeType,
            audioExtension: mixedAudio.extension,
            setState,
            captionItemId,
            filename: `mixed-audio${mixedAudio.extension}`,
          });

          if (!captions || captions.length === 0) {
            const error = 'Caption generation returned no results.';
            toast.error('Captions not generated', { description: error });
            await report('error', { error, targetItemIds: targetItems.map((i) => i.id) });
            return;
          }

          const insertion = addCaptionItemForMultipleTargets({
            targetItems,
            captions,
            captionItemId,
            styleOverrides: style,
            replaceExisting,
          });

          if (!insertion) {
            const error = 'Could not place captions on the timeline.';
            toast.error('Captions not added', { description: error });
            await report('error', { error, targetItemIds: targetItems.map((i) => i.id) });
            return;
          }

          toast.success('Captions added', {
            description: `Generated subtitles for ${targetItems.length} items.`,
          });

          await report('success', {
            mode: 'generate-multi',
            targetItemIds: targetItems.map((i) => i.id),
            captionItemId: insertion.captionItemId,
            captionAssetId: insertion.captionAssetId,
            replacedCaptionItemId: insertion.replacedItemId,
            appliedStyle: insertion.appliedStyle,
            projectState: buildProjectState(insertion.editorState),
          });
          return;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to set captions for multiple items';
          toast.error('Captions failed', { description: message });
          await report('error', {
            error: message,
            targetItemIds: targetItems.map((i) => i.id),
          });
          return;
        }
      }

      // Single item path (original logic)
      const targetItem = targetItems[0];
      const asset = resolveAsset(targetItem);
      if (!asset) {
        const error = 'Captions require a video or audio asset with an available source.';
        toast.error('Cannot set captions', { description: error });
        await report('error', { error, targetItemId: targetItem.id });
        return;
      }

      const src = resolveSourceUrl(asset);
      if (!src) {
        const error = 'Asset is missing a playable source URL.';
        toast.error('Cannot set captions', { description: error });
        await report('error', { error, targetItemId: targetItem.id, assetId: asset.id });
        return;
      }

      const existingCaption = replaceExisting ? findExistingCaptionForTarget({ items, tracks, targetItem }) : null;
      const captionItemId = existingCaption?.id ?? generateRandomId();

      try {
        // Try to use cached transcription from upload first
        let captions = getCachedTranscription(asset);

        if (captions) {
          console.debug('Using cached transcription', captions.length);
        } else {
          // No cache, generate captions via backend
          captions = (await getCaptions({ src, setState, asset, captionItemId })) ?? null;
        }

        if (!captions || captions.length === 0) {
          const error = 'Caption generation returned no results.';
          toast.error('Captions not generated', { description: error });
          await report('error', { error, targetItemId: targetItem.id, assetId: asset.id });
          return;
        }

        const insertion = addCaptionItem({
          targetItem,
          captions,
          captionItemId,
          styleOverrides: style,
          replaceExisting,
        });

        if (!insertion) {
          const error = 'Could not place captions on the timeline.';
          toast.error('Captions not added', { description: error });
          await report('error', { error, targetItemId: targetItem.id, assetId: asset.id });
          return;
        }

        setState({
          commitToUndoStack: false,
          update: (prev) => ({
            ...prev,
            captioningTasks: prev.captioningTasks.map((task) =>
              task.assetId === asset.id && task.type === 'captioning'
                ? {
                    ...task,
                    status: {
                      type: 'done',
                      captions,
                      doneAt: Date.now(),
                      captionItemId: insertion.captionItemId,
                    },
                  }
                : task,
            ),
          }),
        });

        toast.success('Captions added', {
          description: 'Subtitles were generated and placed on the timeline.',
        });

        await report('success', {
          mode: 'generate',
          targetItemId: targetItem.id,
          captionItemId: insertion.captionItemId,
          captionAssetId: insertion.captionAssetId,
          replacedCaptionItemId: insertion.replacedItemId,
          appliedStyle: insertion.appliedStyle,
          projectState: buildProjectState(insertion.editorState),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to set captions';
        toast.error('Captions failed', { description: message });
        await report('error', {
          error: message,
          targetItemId: targetItem.id,
          assetId: asset.id,
        });
      }
    },
    [
      addCaptionItem,
      addCaptionItemForMultipleTargets,
      applyCaptionEdits,
      assets,
      buildProjectState,
      fps,
      getCachedTranscription,
      items,
      reportToolResult,
      resolveAsset,
      resolveCaptionItem,
      resolveSourceUrl,
      resolveTargetItems,
      setState,
      tracks,
      updateCaptionItemStyle,
    ],
  );

  return { setCaptions };
};
