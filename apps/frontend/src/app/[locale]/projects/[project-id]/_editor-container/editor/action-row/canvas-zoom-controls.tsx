import { useContext } from 'react';
import { IconButton } from '@/components/buttons/IconButton';
import { Tooltip, TooltipTrigger, TooltipPanel } from '@/components/ui/tooltip';
import { canvasRef } from '../canvas/canvas';
import { ResetZoomIcon } from '../icons/reset-zoom';
import { ZoomInIcon } from '../icons/zoom-in';
import { ZoomOutIcon } from '../icons/zoom-out';
import { PreviewSizeContext } from '../preview-size';
import { calculateScale } from '../utils/calculate-canvas-transformation';
import { MAX_CANVAS_ZOOM, MIN_CANVAS_ZOOM } from '../utils/smooth-zoom';
import { useDimensions } from '../utils/use-context';

export const CanvasZoomControls: React.FC = () => {
  const { size, setSize } = useContext(PreviewSizeContext);
  const { compositionWidth, compositionHeight } = useDimensions();

  const isFitMode = size.size === 'auto';
  const currentZoom = typeof size.size === 'number' ? size.size : 1;

  // Calculate if buttons should be disabled
  const isZoomInDisabled = !isFitMode && currentZoom >= MAX_CANVAS_ZOOM;
  const isZoomOutDisabled = !isFitMode && currentZoom <= MIN_CANVAS_ZOOM;

  const handleZoomIn = () => {
    if (isZoomInDisabled) return;

    setSize((oldSize) => {
      if (oldSize.size === 'auto') {
        const oldScale = calculateScale({
          canvasSize: canvasRef.current!.getBoundingClientRect(),
          compositionWidth: compositionWidth,
          compositionHeight: compositionHeight,
          previewSize: 'auto',
        });

        return {
          ...oldSize,
          size: oldScale * 1.2,
        };
      }
      return {
        ...oldSize,
        size: Math.min(oldSize.size * 1.2, MAX_CANVAS_ZOOM),
      };
    });
  };

  const handleZoomOut = () => {
    if (isZoomOutDisabled) return;

    setSize((oldSize) => {
      const oldScale = calculateScale({
        canvasSize: canvasRef.current!.getBoundingClientRect(),
        compositionWidth: compositionWidth,
        compositionHeight: compositionHeight,
        previewSize: 'auto',
      });
      if (oldSize.size === 'auto') {
        return {
          ...oldSize,
          size: oldScale * 0.8,
        };
      }
      return {
        ...oldSize,
        size: Math.max(oldSize.size * 0.8, MIN_CANVAS_ZOOM),
      };
    });
  };

  const handleFit = () => {
    setSize(() => ({
      translation: {
        x: 0,
        y: 0,
      },
      size: 'auto',
    }));
  };

  return (
    <div className="flex items-center gap-1 rounded bg-white/5 text-white">
      {!isFitMode && (
        <Tooltip delay={1500}>
          <TooltipTrigger asChild>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={handleFit}
              aria-label="Reset to Auto"
              data-is-fit-mode={isFitMode}
              className="text-white"
            >
              <ResetZoomIcon />
            </IconButton>
          </TooltipTrigger>
          <TooltipPanel>Reset to Fit</TooltipPanel>
        </Tooltip>
      )}
      <Tooltip delay={1500}>
        <TooltipTrigger asChild>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={isZoomOutDisabled}
            aria-label="Zoom out"
            className="text-white"
          >
            <ZoomOutIcon className="h-3 w-3" />
          </IconButton>
        </TooltipTrigger>
        <TooltipPanel>Zoom out</TooltipPanel>
      </Tooltip>

      <div className="flex min-w-[50px] cursor-default items-center justify-center text-center text-xs font-medium">
        {isFitMode ? 'Fit' : `${Math.round(currentZoom * 100)}%`}
      </div>

      <Tooltip delay={1500}>
        <TooltipTrigger asChild>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={isZoomInDisabled}
            aria-label="Zoom in"
            className="text-white"
          >
            <ZoomInIcon className="h-3 w-3" />
          </IconButton>
        </TooltipTrigger>
        <TooltipPanel>Zoom in</TooltipPanel>
      </Tooltip>
    </div>
  );
};
