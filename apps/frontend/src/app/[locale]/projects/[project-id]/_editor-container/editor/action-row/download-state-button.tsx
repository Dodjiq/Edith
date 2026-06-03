import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { IconButton } from '@/components/buttons/IconButton';
import { Tooltip, TooltipTrigger, TooltipPanel } from '@/components/ui/tooltip';
import { DownloadIcon } from '../icons/download-state';
import { cleanUpStateBeforeSaving } from '../state/clean-up-state-before-saving';
import { useEditorAssetsStore } from '../state/editor-assets-store';
import { hasUploadingAssets } from '../utils/upload-status';
import { useFullState } from '../utils/use-context';

export const DownloadStateButton = () => {
  const state = useFullState();
  const originalAssets = useEditorAssetsStore((store) => store.originalAssets);

  const handleDownload = useCallback(() => {
    try {
      const stateToDownload = {
        version: 1,
        undoableState: cleanUpStateBeforeSaving(state.undoableState),
        editorState: {
          selectedItems: state.selectedItems,
          loop: state.loop,
          timelineHeight: state.timelineHeight,
          isSnappingEnabled: state.isSnappingEnabled,
        },
        originalAssets,
      };

      // Create a blob with the state data
      const dataStr = JSON.stringify(stateToDownload, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      // Create download link
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `editor-state-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up URL
      URL.revokeObjectURL(url);

      toast.success('State downloaded successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to download state');
    }
  }, [originalAssets, state]);

  const assetsUploading = hasUploadingAssets(state.assetStatus);

  const tooltipText = useMemo(() => {
    if (assetsUploading) {
      return 'Cannot download while assets are uploading';
    }
    return 'Download state';
  }, [assetsUploading]);

  return (
    <Tooltip delay={1500}>
      <TooltipTrigger asChild>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          disabled={assetsUploading}
          aria-label="Download state"
          data-uploading={Boolean(assetsUploading)}
          className="text-white"
        >
          <DownloadIcon />
        </IconButton>
      </TooltipTrigger>
      <TooltipPanel>{tooltipText}</TooltipPanel>
    </Tooltip>
  );
};
