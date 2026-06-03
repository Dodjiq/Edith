'use client';

import { Captions } from 'lucide-react';
import React from 'react';
import { scrollbarStyle } from '../constants';
import { CaptionsInspector } from '../inspector/captions-inspector';
import { CaptionsItem } from '../items/captions/captions-item-type';
import { useAllItems, useSelectedItems } from '../utils/use-context';

export const CaptionsPanel: React.FC = () => {
  const { selectedItems } = useSelectedItems();
  const { items } = useAllItems();

  const selectedCaptionsItem = React.useMemo(() => {
    if (selectedItems.length !== 1) return null;
    const item = items[selectedItems[0]];
    if (item?.type === 'captions') return item as CaptionsItem;
    return null;
  }, [selectedItems, items]);

  return (
    <div
      className="border-r-editor-starter-border bg-editor-starter-panel flex h-full w-[300px] flex-col overflow-y-auto border-r text-white"
      style={scrollbarStyle}
    >
      {selectedCaptionsItem ? (
        <div className="flex-1 overflow-y-auto">
          <CaptionsInspector item={selectedCaptionsItem} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-white/5">
            <Captions className="size-6 text-neutral-400" />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-neutral-300">Create Captions</span>
            <span className="text-xs text-neutral-500">
              Select a video or audio clip and use the &quot;Caption&quot; button in the inspector to generate captions.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
