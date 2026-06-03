import React, { useState } from 'react';
import { AnimatedButton } from '@/components/buttons/animated-button/AnimatedButton';
import { Tooltip, TooltipTrigger, TooltipPanel } from '@/components/tooltip';
import { isTimelineEmpty } from '../utils/is-timeline-empty';
import { useTracks } from '../utils/use-context';
import { ExportDialog } from './export-dialog';

export const ExportButton: React.FC = () => {
  const { tracks } = useTracks();
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const disabled = isTimelineEmpty(tracks);

  const handleClick = () => {
    if (!disabled) {
      setDialogOpen(true);
    }
  };

  return (
    <>
      <Tooltip delay={1500}>
        <TooltipTrigger asChild>
          <AnimatedButton
            size="sm"
            variant="default"
            onClick={handleClick}
            disabled={disabled}
            aria-label="Export video"
          >
            <span>Export</span>
          </AnimatedButton>
        </TooltipTrigger>
        <TooltipPanel>Export video</TooltipPanel>
      </Tooltip>
      <ExportDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
};
