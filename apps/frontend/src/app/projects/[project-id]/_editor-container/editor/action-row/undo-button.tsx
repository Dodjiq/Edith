import { useCallback } from 'react';
import { IconButton } from '@/components/buttons/IconButton';
import { Tooltip, TooltipTrigger, TooltipPanel } from '@/components/ui/tooltip';
import { UndoIcon } from '../icons/undo';
import { useCanUseUndoStack, useWriteContext } from '../utils/use-context';

export const UndoButton = () => {
  const { undo } = useWriteContext();
  const { canUndo } = useCanUseUndoStack();

  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  return (
    <Tooltip delay={1500}>
      <TooltipTrigger asChild>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={handleUndo}
          disabled={!canUndo}
          aria-label="Undo"
          className="text-white"
        >
          <UndoIcon />
        </IconButton>
      </TooltipTrigger>
      <TooltipPanel>Undo (Ctrl+Z / Cmd+Z)</TooltipPanel>
    </Tooltip>
  );
};
