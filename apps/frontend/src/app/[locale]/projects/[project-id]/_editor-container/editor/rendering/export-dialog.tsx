import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CanvasSizeControls } from '../inspector/components/canvas-size-controls';
import { InspectorLabel } from '../inspector/components/inspector-label';
import { getCompositionDuration } from '../utils/get-composition-duration';
import { renderFrame } from '../utils/render-frame';
import { useAllItems, useCurrentStateAsRef, useFps, useWriteContext } from '../utils/use-context';
import { CodecOption, CodecSelector } from './codec-selector';
import { triggerLambdaRender } from './render-state';
import { Button } from '@/components/buttons/button';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ open, onOpenChange }) => {
  const { setState } = useWriteContext();
  const state = useCurrentStateAsRef();
  const { fps } = useFps();
  const { items } = useAllItems();
  const [selectedCodec, setSelectedCodec] = useState<CodecOption>('h264');

  const durationInFrames = React.useMemo(() => {
    return getCompositionDuration(Object.values(items));
  }, [items]);

  const onExport = () => {
    const { assets, tracks, items, compositionHeight, compositionWidth, fps } = state.current.undoableState;
    const duration = getCompositionDuration(Object.values(items));

    // Close dialog immediately, don't wait for render to complete
    onOpenChange(false);

    triggerLambdaRender({
      compositionHeight,
      compositionWidth,
      compositionDurationInSeconds: duration / fps,
      setState,
      tracks,
      assets,
      items,
      codec: selectedCodec,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Export Video</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <InspectorLabel>Canvas Size</InspectorLabel>
            <CanvasSizeControls />
          </div>
          <div>
            <InspectorLabel>Duration</InspectorLabel>
            <div className="text-xs text-neutral-300">{renderFrame(durationInFrames, fps)}</div>
          </div>
          <div>
            <InspectorLabel>Format</InspectorLabel>
            <CodecSelector value={selectedCodec} onValueChange={setSelectedCodec} />
          </div>
          <Button size="default" variant="default" onClick={onExport} className="w-full">
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
