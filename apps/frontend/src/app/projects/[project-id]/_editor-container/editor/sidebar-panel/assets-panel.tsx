'use client';

import React, { useCallback, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { IconButton } from '@/components/buttons/IconButton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipTrigger, TooltipPanel } from '@/components/ui/tooltip';
import api from '@/utils/services/api-frontend';
import { scrollbarStyle } from '../constants';
import { PlusIcon } from '../icons/plus';
import { EditorStarterAsset } from '../assets/assets';
import { clearAssetLocalState } from '../caching/load-to-blob-url';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../context-menu';
import { useLibraryAssets } from '../library';
import { AssetCard, formatFileSize } from '../library/asset-card';
import { removeUnavailableAsset } from '../state/actions/remove-unavailable-asset';
import { useIsDevMode } from '../context/DevModeContext';
import { useUploadDialog } from '../upload-dialog-context';
import { useAssetStatus, useAssets, useWriteContext } from '../utils/use-context';

const LIBRARY_ASSET_DRAG_TYPE = 'application/x-library-asset';

export const AssetsPanel: React.FC = () => {
  const { libraryAssets } = useLibraryAssets();
  const { assets: timelineAssets } = useAssets();
  const { assetStatus } = useAssetStatus();
  const { setState } = useWriteContext();
  const isDevMode = useIsDevMode();
  const { openUploadDialog } = useUploadDialog();
  const { mutateAsync: deleteAsset } = api.upload.deleteAsset.useMutation();
  const [assetToDelete, setAssetToDelete] = React.useState<EditorStarterAsset | null>(null);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);

  const handleAddClick = useCallback(() => {
    openUploadDialog();
  }, [openUploadDialog]);

  const handleDragStart = useCallback((e: React.DragEvent, asset: EditorStarterAsset) => {
    e.dataTransfer.setData(LIBRARY_ASSET_DRAG_TYPE, asset.id);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleDeleteAsset = useCallback(async () => {
    if (!assetToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await deleteAsset({
        params: { assetId: assetToDelete.id },
        body: {
          fileKey: assetToDelete.remoteFileKey,
          twelveLabs: assetToDelete.type === 'video' ? assetToDelete.twelveLabs : undefined,
        },
      });

      setState({
        update: (state) => removeUnavailableAsset({ state, assetId: assetToDelete.id }),
        commitToUndoStack: true,
      });
      await clearAssetLocalState(assetToDelete.id);

      const warnings = 'body' in response ? response.body.warnings : [];
      toast.success('Asset deleted', {
        description: warnings.length > 0 ? warnings[0] : assetToDelete.filename,
      });
      setAssetToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete asset';
      toast.error('Failed to delete asset', { description: message });
    } finally {
      setIsDeleting(false);
    }
  }, [assetToDelete, deleteAsset, setState]);

  const assetsList = useMemo(() => {
    return (
      Object.values(libraryAssets)
        // Only show "root" assets (original uploads), not derived assets from AI splicing
        .filter((asset) => !asset.parentAssetId)
        .sort((a, b) => {
          // Sort by filename
          return a.filename.localeCompare(b.filename);
        })
    );
  }, [libraryAssets]);

  const totalSize = useMemo(() => {
    return assetsList.reduce((sum, asset) => sum + asset.size, 0);
  }, [assetsList]);

  const hasAssets = assetsList.length > 0;

  return (
    <div className="border-r-editor-starter-border bg-editor-starter-panel flex h-full w-[300px] flex-col overflow-hidden border-r text-white">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-1 px-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-400">Assets</span>
          {isDevMode && hasAssets && <span className="text-xs text-neutral-500">({formatFileSize(totalSize)})</span>}
        </div>
        <Tooltip delay={500}>
          <TooltipTrigger asChild>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={handleAddClick}
              aria-label="Add asset"
              className="text-white hover:bg-white/10"
            >
              <PlusIcon className="h-4 w-4" />
            </IconButton>
          </TooltipTrigger>
          <TooltipPanel>Add asset to library</TooltipPanel>
        </Tooltip>
      </div>

      {/* Asset grid */}
      <div className="flex-1 overflow-y-auto p-3" style={scrollbarStyle}>
        {hasAssets ? (
          <div className="grid grid-cols-2 gap-2">
            {assetsList.map((asset) => (
              <ContextMenu key={asset.id}>
                <ContextMenuTrigger asChild>
                  <div>
                    <AssetCard
                      asset={asset}
                      status={assetStatus[asset.id]}
                      onDragStart={handleDragStart}
                      isOnTimeline={Boolean(timelineAssets[asset.id])}
                    />
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    className="gap-2 text-red-300 hover:text-red-200"
                    disabled={assetStatus[asset.id]?.type === 'in-progress' || isDeleting}
                    onSelect={() => setAssetToDelete(asset)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete asset
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div>
              <p className="text-sm text-neutral-400">No assets yet</p>
              <p className="mt-1 text-xs text-neutral-500">Click + to add media files</p>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={Boolean(assetToDelete)} onOpenChange={(open) => !open && !isDeleting && setAssetToDelete(null)}>
        <AlertDialogContent className="border-white/10 bg-neutral-950 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the asset from the editor, deletes timeline items using it, and cleans up the uploaded file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteAsset();
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export { LIBRARY_ASSET_DRAG_TYPE };
