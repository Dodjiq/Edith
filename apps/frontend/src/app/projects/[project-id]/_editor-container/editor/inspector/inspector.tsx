import React, { useContext, useMemo, useRef } from 'react';
import { scrollbarStyle } from '../constants';
import { StateInitializedContext } from '../context-provider';
import { useSidebarPanel } from '../sidebar-panel/sidebar-panel-context';
import { useAllItems, useSelectedItems } from '../utils/use-context';
import { InspectorContent } from './inspector-content';
import { useInspectorScrollRestoration } from './scroll-restoration';
import { cn } from '@/lib/utils';

export const INSPECTOR_WIDTH = 350;

export const Inspector: React.FC = () => {
  const { selectedItems } = useSelectedItems();
  const { items } = useAllItems();
  const initialized = useContext(StateInitializedContext);
  const { activePanel } = useSidebarPanel();

  const ref = useRef<HTMLDivElement>(null);

  useInspectorScrollRestoration(ref, selectedItems);

  const style: React.CSSProperties = useMemo(() => {
    return {
      ...scrollbarStyle,
      width: INSPECTOR_WIDTH,
    };
  }, []);

  const isSelectedItem = selectedItems.length === 1 && initialized;

  // Hide inspector if a sidebar panel is open and the selected item matches that panel type
  const selectedItem = isSelectedItem ? items[selectedItems[0]] : null;
  const isSidebarPanelHandlingItem =
    (activePanel === 'text' && selectedItem?.type === 'text') ||
    (activePanel === 'solid' && selectedItem?.type === 'solid');

  // Also hide if sidebar panel is open and no item is selected (panel shows create button)
  const shouldHide = !isSelectedItem || isSidebarPanelHandlingItem;

  return (
    <div
      className={cn(
        'border-r-editor-starter-border bg-editor-starter-panel w-[350px] overflow-y-auto border-r text-white',
        shouldHide && 'hidden',
      )}
      style={style}
      ref={ref}
    >
      {isSelectedItem ? <InspectorContent itemId={selectedItems[0]} /> : initialized ? <></> : null}
    </div>
  );
};
