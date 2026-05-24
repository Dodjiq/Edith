import { PlayerRef } from '@remotion/player';
import React from 'react';
import { DebugDrawer } from '../debug-drawer/debug-drawer';
import {
  FEATURE_CANVAS_ZOOM_CONTROLS,
  FEATURE_DOWNLOAD_STATE,
  FEATURE_LOAD_STATE,
  FEATURE_REDO_BUTTON,
  FEATURE_SAVE_BUTTON,
  FEATURE_UNDO_BUTTON,
} from '../flags';
import { ExportButton } from '../rendering/export-button';
import { CanvasZoomControls } from './canvas-zoom-controls';
import { RedoButton } from './redo-button';
import { SaveButton } from './save-button';
import { TasksIndicator } from './tasks-indicator/tasks-indicator';
import { ToolSelection } from './tool-selection';
import { UndoButton } from './undo-button';
import { DownloadStateButton } from './download-state-button';
import { LoadStateButton } from './load-state-button';
import { useIsDevMode } from '../context/DevModeContext';

export const ActionRow: React.FC<{
  playerRef: React.RefObject<PlayerRef | null>;
}> = ({ playerRef }) => {
  const isDevMode = useIsDevMode();
  return (
    <div className="border-b-editor-starter-border bg-editor-starter-panel flex w-full items-center gap-4 border-b p-2">
      <ToolSelection playerRef={playerRef} />
      <div className="flex items-center gap-1 overflow-hidden rounded bg-white/5">
        {FEATURE_UNDO_BUTTON && <UndoButton />}
        {FEATURE_REDO_BUTTON && <RedoButton />}
        {FEATURE_SAVE_BUTTON && <SaveButton />}
        {isDevMode && (
          <>
            {FEATURE_DOWNLOAD_STATE && <DownloadStateButton />}
            {FEATURE_LOAD_STATE && <LoadStateButton />}
          </>
        )}
      </div>
      {FEATURE_CANVAS_ZOOM_CONTROLS ? <CanvasZoomControls /> : null}
      <TasksIndicator />
      <div className="flex-1"></div>
      <DebugDrawer />
      <ExportButton />
    </div>
  );
};
