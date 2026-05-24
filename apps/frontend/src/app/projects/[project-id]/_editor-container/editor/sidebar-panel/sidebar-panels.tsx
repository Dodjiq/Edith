'use client';

import { PlayerRef } from '@remotion/player';
import React from 'react';
import { useSidebarPanel } from './sidebar-panel-context';
import { AssetsPanel } from './assets-panel';
import { CaptionsPanel } from './captions-panel';
import { ImagePanel } from './image-panel';
import { InspectorPanel } from './inspector-panel';
import { MotionDesignPanel } from './motion-design-panel';
import { SolidPanel } from './solid-panel';
import { TextPanel } from './text-panel';

interface SidebarPanelsProps {
  playerRef: React.RefObject<PlayerRef | null>;
}

export const SidebarPanels: React.FC<SidebarPanelsProps> = ({ playerRef }) => {
  const { activePanel } = useSidebarPanel();

  switch (activePanel) {
    case 'assets':
      return <AssetsPanel />;
    case 'text':
      return <TextPanel playerRef={playerRef} />;
    case 'solid':
      return <SolidPanel playerRef={playerRef} />;
    case 'image':
      return <ImagePanel playerRef={playerRef} />;
    case 'captions':
      return <CaptionsPanel />;
    case 'motion-design':
      return <MotionDesignPanel playerRef={playerRef} />;
    case 'inspector':
      return <InspectorPanel />;
    default:
      return <AssetsPanel />;
  }
};
