import { PlayerRef } from '@remotion/player';
import React from 'react';
import { Canvas } from './canvas/canvas';
import { EditorInteractionLockBoundary } from './editor-interaction-lock-boundary';
import { SidebarPanels } from './sidebar-panel/sidebar-panels';
import { useLoop } from './utils/use-context';

export const TopPanel: React.FC<{
  playerRef: React.RefObject<PlayerRef | null>;
}> = ({ playerRef }) => {
  const loop = useLoop();

  return (
    <EditorInteractionLockBoundary className="h-full w-full flex-1" tooltipSide="bottom">
      <div className="absolute flex h-full w-full flex-row">
        <SidebarPanels playerRef={playerRef} />
        <Canvas playerRef={playerRef} loop={loop} />
      </div>
    </EditorInteractionLockBoundary>
  );
};
