'use client';

import { PlayerRef } from '@remotion/player';
import { Plus } from 'lucide-react';
import React, { useCallback } from 'react';
import { Button } from '@/components/buttons/button';
import { scrollbarStyle } from '../constants';
import { addItem } from '../state/actions/add-item';
import { byDefaultKeepAspectRatioMap } from '../utils/aspect-ratio';
import { generateRandomId } from '../utils/generate-random-id';
import { useAllItems, useDimensions, useSelectedItems, useWriteContext } from '../utils/use-context';
import { SolidInspector } from '../inspector/solid-inspector';
import { SolidItem } from '../items/solid/solid-item-type';

const SOLID_DURATION_IN_FRAMES = 100;
const DEFAULT_SOLID_SIZE = 200;

interface SolidPanelProps {
  playerRef: React.RefObject<PlayerRef | null>;
}

export const SolidPanel: React.FC<SolidPanelProps> = ({ playerRef }) => {
  const { setState } = useWriteContext();
  const { compositionWidth, compositionHeight } = useDimensions();
  const { selectedItems } = useSelectedItems();
  const { items } = useAllItems();

  const selectedSolidItem = React.useMemo(() => {
    if (selectedItems.length !== 1) return null;
    const item = items[selectedItems[0]];
    if (item?.type === 'solid') return item as SolidItem;
    return null;
  }, [selectedItems, items]);

  const handleAddSolid = useCallback(() => {
    const id = generateRandomId();
    const left = Math.round((compositionWidth - DEFAULT_SOLID_SIZE) / 2);
    const top = Math.round((compositionHeight - DEFAULT_SOLID_SIZE) / 2);

    setState({
      update: (state) => {
        return addItem({
          state,
          item: {
            type: 'solid',
            color: '#ffffff',
            durationInFrames: SOLID_DURATION_IN_FRAMES,
            from: playerRef.current?.getCurrentFrame() ?? 0,
            top,
            left,
            width: DEFAULT_SOLID_SIZE,
            height: DEFAULT_SOLID_SIZE,
            isDraggingInTimeline: false,
            id,
            opacity: 1,
            borderRadius: 0,
            rotation: 0,
            keepAspectRatio: byDefaultKeepAspectRatioMap.solid,
            fadeInDurationInSeconds: 0,
            fadeOutDurationInSeconds: 0,
          },
          select: true,
          position: { type: 'front' },
        });
      },
      commitToUndoStack: true,
    });
  }, [compositionWidth, compositionHeight, playerRef, setState]);

  return (
    <div
      className="border-r-editor-starter-border bg-editor-starter-panel flex h-full w-[300px] flex-col overflow-y-auto border-r text-white"
      style={scrollbarStyle}
    >
      <div className="border-b border-white/10 p-3">
        <Button onClick={handleAddSolid} className="w-full gap-2" size="sm">
          <Plus className="size-4" />
          Add Shape
        </Button>
      </div>

      {selectedSolidItem && (
        <div className="flex-1 overflow-y-auto">
          <SolidInspector item={selectedSolidItem} />
        </div>
      )}
    </div>
  );
};
