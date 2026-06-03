import { useCallback } from 'react';
import { IconButton } from '@/components/buttons/IconButton';
import { Tooltip, TooltipTrigger, TooltipPanel } from '@/components/ui/tooltip';
import { RedoIcon } from '../icons/redo';
import { useCanUseUndoStack, useWriteContext } from '../utils/use-context';

export const RedoButton = () => {
  const { redo } = useWriteContext();
  const { canRedo } = useCanUseUndoStack();

  const handleRedo = useCallback(() => {
    redo();
  }, [redo]);

  return (
    <Tooltip delay={1500}>
      <TooltipTrigger asChild>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={handleRedo}
          disabled={!canRedo}
          aria-label="Redo"
          className="text-white"
        >
          <RedoIcon />
        </IconButton>
      </TooltipTrigger>
      <TooltipPanel>Redo (Ctrl+Y / Cmd+Shift+Z)</TooltipPanel>
    </Tooltip>
  );
};
