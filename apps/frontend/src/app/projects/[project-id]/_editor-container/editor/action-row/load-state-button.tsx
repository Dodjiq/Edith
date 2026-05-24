import { useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { IconButton } from '@/components/buttons/IconButton';
import { Tooltip, TooltipTrigger, TooltipPanel } from '@/components/ui/tooltip';
import { UploadIcon } from '../icons/upload';
import { useEditorAssetsStore, type OriginalAssetRecord } from '../state/editor-assets-store';
import { createAssetStatusFromUndoableState } from '../utils/asset-status-utils';
import { filterSelectedItemstoOnlyReturnExistingItems } from '../utils/filter-selected-items-for-only-existing-items';
import { EditorState, UndoableState } from '../state/types';
import { hasUploadingAssets } from '../utils/upload-status';
import { useFullState, useWriteContext } from '../utils/use-context';

type DownloadedState = {
  version: 1;
  undoableState: UndoableState;
  editorState?: {
    selectedItems?: string[];
    loop?: boolean;
    timelineHeight?: number;
    isSnappingEnabled?: boolean;
  };
  originalAssets?: Record<string, OriginalAssetRecord>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isUndoableState = (value: unknown): value is UndoableState => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.tracks) &&
    isRecord(value.items) &&
    isRecord(value.assets) &&
    typeof value.fps === 'number' &&
    typeof value.compositionWidth === 'number' &&
    typeof value.compositionHeight === 'number'
  );
};

const normalizeUndoableState = (state: UndoableState): UndoableState => {
  const libraryAssets = isRecord(state.libraryAssets) ? state.libraryAssets : { ...state.assets };
  const deletedAssets = Array.isArray(state.deletedAssets) ? state.deletedAssets : [];

  return {
    ...state,
    libraryAssets,
    deletedAssets,
  };
};

const parseDownloadedState = (
  value: unknown,
): {
  undoableState: UndoableState;
  editorState?: DownloadedState['editorState'];
  originalAssets?: Record<string, OriginalAssetRecord>;
} => {
  if (!isRecord(value)) {
    throw new Error('Invalid state file format');
  }

  if ('version' in value && value.version === 1 && 'undoableState' in value) {
    const possibleState = value as DownloadedState;
    if (!isUndoableState(possibleState.undoableState)) {
      throw new Error('Invalid state file format');
    }

    return {
      undoableState: possibleState.undoableState,
      editorState: possibleState.editorState,
      originalAssets: isRecord(possibleState.originalAssets) ? possibleState.originalAssets : undefined,
    };
  }

  if (isUndoableState(value)) {
    return {
      undoableState: value,
    };
  }

  throw new Error('Invalid state file format');
};

export const LoadStateButton = () => {
  const state = useFullState();
  const { setState } = useWriteContext();
  const setOriginalAssets = useEditorAssetsStore((store) => store.setOriginalAssets);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      // Validate file type
      if (!file.name.endsWith('.json')) {
        toast.error('Please select a valid JSON file');
        return;
      }

      const loadingToastId = toast.loading('Importing state...', {
        description: 'Restoring assets and timeline',
        position: 'top-right',
      });

      const reader = new FileReader();
      reader.onload = (e) => {
        const loadStateFromFile = async () => {
          const result = e.target?.result;
          if (typeof result !== 'string') {
            throw new Error('Failed to read file');
          }

          const parsed = parseDownloadedState(JSON.parse(result));
          const normalizedUndoableState = normalizeUndoableState(parsed.undoableState);
          const assetStatus = await createAssetStatusFromUndoableState(normalizedUndoableState);
          const selectedItems = filterSelectedItemstoOnlyReturnExistingItems({
            selectedItems: Array.isArray(parsed.editorState?.selectedItems)
              ? parsed.editorState?.selectedItems.filter((item) => typeof item === 'string')
              : [],
            items: normalizedUndoableState.items,
          });
          const loop = typeof parsed.editorState?.loop === 'boolean' ? parsed.editorState.loop : undefined;
          const timelineHeight =
            typeof parsed.editorState?.timelineHeight === 'number' ? parsed.editorState.timelineHeight : undefined;
          const isSnappingEnabled =
            typeof parsed.editorState?.isSnappingEnabled === 'boolean'
              ? parsed.editorState.isSnappingEnabled
              : undefined;

          setOriginalAssets(parsed.originalAssets ?? {});

          setState({
            update: (prevState: EditorState) => ({
              ...prevState,
              undoableState: normalizedUndoableState,
              assetStatus,
              selectedItems,
              loop: loop ?? prevState.loop,
              timelineHeight: timelineHeight ?? prevState.timelineHeight,
              isSnappingEnabled: isSnappingEnabled ?? prevState.isSnappingEnabled,
              textItemEditing: null,
              textItemHoverPreview: null,
              renderingTasks: [],
              captioningTasks: [],
              itemsBeingTrimmed: [],
              activeSnapPoint: null,
            }),
            commitToUndoStack: true,
          });

          toast.success('State loaded successfully', { id: loadingToastId });
        };

        loadStateFromFile().catch((error) => {
          toast.error(error instanceof Error ? `Failed to load state: ${error.message}` : 'Failed to load state', {
            id: loadingToastId,
          });
        });
      };

      reader.onerror = () => {
        toast.error('Failed to read file', { id: loadingToastId });
      };

      reader.readAsText(file);

      // Reset the input so the same file can be selected again
      event.target.value = '';
    },
    [setOriginalAssets, setState],
  );

  const assetsUploading = hasUploadingAssets(state.assetStatus);

  const tooltipText = useMemo(() => {
    if (assetsUploading) {
      return 'Cannot load while assets are uploading';
    }
    return 'Load state from file';
  }, [assetsUploading]);

  return (
    <>
      <Tooltip delay={1500}>
        <TooltipTrigger asChild>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={handleLoadClick}
            disabled={assetsUploading}
            aria-label="Load state from file"
            data-uploading={Boolean(assetsUploading)}
            className="text-white"
          >
            <UploadIcon />
          </IconButton>
        </TooltipTrigger>
        <TooltipPanel>{tooltipText}</TooltipPanel>
      </Tooltip>
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
    </>
  );
};
