'use client';

import { PlayerRef } from '@remotion/player';
import { Plus } from 'lucide-react';
import React, { useCallback } from 'react';
import { Button } from '@/components/buttons/button';
import { scrollbarStyle } from '../constants';
import { createTextItem } from '../items/text/create-text-item';
import { addItem } from '../state/actions/add-item';
import { markTextAsEditing } from '../state/actions/text-item-editing';
import { useAllItems, useDimensions, useSelectedItems, useWriteContext } from '../utils/use-context';
import { TextInspector } from '../inspector/text-inspector';
import { TextItem } from '../items/text/text-item-type';

interface TextPanelProps {
  playerRef: React.RefObject<PlayerRef | null>;
}

export const TextPanel: React.FC<TextPanelProps> = ({ playerRef }) => {
  const { setState } = useWriteContext();
  const { compositionWidth, compositionHeight } = useDimensions();
  const { selectedItems } = useSelectedItems();
  const { items } = useAllItems();

  const selectedTextItem = React.useMemo(() => {
    if (selectedItems.length !== 1) return null;
    const item = items[selectedItems[0]];
    if (item?.type === 'text') return item as TextItem;
    return null;
  }, [selectedItems, items]);

  const handleAddText = useCallback(async () => {
    const xOnCanvas = compositionWidth / 2;
    const yOnCanvas = compositionHeight / 2;

    const item = await createTextItem({
      xOnCanvas,
      yOnCanvas,
      from: playerRef.current?.getCurrentFrame() ?? 0,
      text: 'Text',
      align: 'center',
    });

    setState({
      update: (state) => {
        const newState = addItem({
          state,
          item,
          select: true,
          position: { type: 'front' },
        });
        return markTextAsEditing({ state: newState, itemId: item.id });
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
        <Button onClick={handleAddText} className="w-full gap-2" size="sm">
          <Plus className="size-4" />
          Add Text
        </Button>
      </div>

      {selectedTextItem && (
        <div className="flex-1 overflow-y-auto">
          <TextInspector item={selectedTextItem} />
        </div>
      )}
    </div>
  );
};
