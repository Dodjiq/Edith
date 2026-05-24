'use client';

import React, { useContext, useRef } from 'react';
import { scrollbarStyle } from '../constants';
import { StateInitializedContext } from '../context-provider';
import { useSelectedItems } from '../utils/use-context';
import { InspectorContent } from '../inspector/inspector-content';
import { useInspectorScrollRestoration } from '../inspector/scroll-restoration';

export const InspectorPanel: React.FC = () => {
  const { selectedItems } = useSelectedItems();
  const initialized = useContext(StateInitializedContext);
  const ref = useRef<HTMLDivElement>(null);

  useInspectorScrollRestoration(ref, selectedItems);

  const isSelectedItem = selectedItems.length === 1 && initialized;

  return (
    <div
      className="border-r-editor-starter-border bg-editor-starter-panel flex h-full w-[300px] flex-col overflow-y-auto border-r text-white"
      style={scrollbarStyle}
      ref={ref}
    >
      {isSelectedItem ? <InspectorContent itemId={selectedItems[0]} /> : null}
    </div>
  );
};
