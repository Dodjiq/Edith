'use client';

import React, { useState, useCallback, useRef } from 'react';
import JsonView from 'react18-json-view';
import { Download, X } from 'lucide-react';
import { toast } from 'sonner';
import { useChatContext } from '../../../_chatbot/context/ChatContext';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { IconButton } from '@/components/buttons/IconButton';
import { Tooltip, TooltipTrigger, TooltipPanel } from '@/components/tooltip';
import { Tabs, TabsList, TabsTab, TabsPanels, TabsPanel } from '@/components/tabs/tabs';
import { cleanUpAssetStatus, cleanUpStateBeforeSaving } from '../state/clean-up-state-before-saving';
import { useIsDevMode } from '../context/DevModeContext';
import { useFullState } from '../utils/use-context';
import { BugIcon } from './bug-icon';
import { downloadDebugJson } from './debug-download';
import { JsonViewer } from './json-viewer';
import { TranscriptionSearch, type SearchResult } from './transcription-search';
import type { ChatMessage } from '../../../_chatbot/types/chatbot';
import type { EditorStarterItem } from '../items/item-type';
import type { EditorState, UndoableState } from '../state/types';

type DebugDownloadButtonProps = {
  label: string;
  tooltip: string;
  fileNamePrefix: string;
  getData: () => unknown;
};

const createProjectStateData = (state: EditorState): UndoableState => {
  const cleanedUpState = cleanUpAssetStatus(state);
  return cleanUpStateBeforeSaving(cleanedUpState.undoableState);
};

const createProjectStateExportData = (state: EditorState, undoableState: UndoableState) => ({
  version: 1,
  undoableState,
  editorState: {
    selectedItems: state.selectedItems,
    textItemEditing: state.textItemEditing,
    textItemHoverPreview: state.textItemHoverPreview,
    renderingTasks: state.renderingTasks,
    captioningTasks: state.captioningTasks,
    initialized: state.initialized,
    itemsBeingTrimmed: state.itemsBeingTrimmed,
    loop: state.loop,
    timelineHeight: state.timelineHeight,
    assetStatus: state.assetStatus,
    isSnappingEnabled: state.isSnappingEnabled,
    activeSnapPoint: state.activeSnapPoint,
  },
});

const getSubagentDebugEvents = (messages: ChatMessage[]) =>
  messages.flatMap((message) =>
    message.parts
      .filter((part) => part.type === 'subagent-debug')
      .map((part) => ({
        messageId: message.id,
        messageIndex: message.messageIndex,
        event: part.event,
      })),
  );

const DebugDownloadButton: React.FC<DebugDownloadButtonProps> = ({ label, tooltip, fileNamePrefix, getData }) => {
  const handleDownload = useCallback(() => {
    try {
      downloadDebugJson({ data: getData(), fileNamePrefix });
      toast.success(`${label} downloaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to download ${label.toLowerCase()}`);
    }
  }, [fileNamePrefix, getData, label]);

  return (
    <Tooltip delay={800}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-zinc-800 px-2.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-700"
        >
          <Download className="h-3.5 w-3.5" />
          {label}
        </button>
      </TooltipTrigger>
      <TooltipPanel>{tooltip}</TooltipPanel>
    </Tooltip>
  );
};

type FocusedResult = {
  itemId: string;
  captionIndex: number;
  jsonPath: string;
};

type ProjectStateTabProps = {
  cleanedState: UndoableState;
};

const ProjectStateTab: React.FC<ProjectStateTabProps> = ({ cleanedState }) => {
  const [focusedResult, setFocusedResult] = useState<FocusedResult | null>(null);
  const jsonContainerRef = useRef<HTMLDivElement>(null);

  const items = React.useMemo((): Record<string, EditorStarterItem> => cleanedState.items ?? {}, [cleanedState]);

  const focusedData = React.useMemo(() => {
    if (!focusedResult) return null;

    const item = items[focusedResult.itemId];
    if (!item) return null;

    const transcribableItem = item as { transcription?: unknown[] };
    if (!transcribableItem.transcription) return null;

    // Show focusedCaption first so it's visible without scrolling
    return {
      _matchedCaption: transcribableItem.transcription[focusedResult.captionIndex],
      _captionIndex: focusedResult.captionIndex,
      item,
    };
  }, [focusedResult, items]);

  const handleResultClick = useCallback((result: SearchResult) => {
    setFocusedResult({
      itemId: result.itemId,
      captionIndex: result.captionIndex,
      jsonPath: result.jsonPath,
    });
  }, []);

  const handleClearFocus = useCallback(() => {
    setFocusedResult(null);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col">
      <TranscriptionSearch items={items} onResultClick={handleResultClick} />

      {focusedResult && focusedData && (
        <div className="mb-3 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-yellow-300">Focused View</span>
              <code className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
                {focusedResult.jsonPath}
              </code>
            </div>
            <button
              onClick={handleClearFocus}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto rounded bg-zinc-950 p-3">
            <JsonView
              src={focusedData}
              theme="default"
              dark
              collapsed={false}
              enableClipboard
              style={{
                fontSize: '12px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                backgroundColor: 'transparent',
                lineHeight: '1.6',
              }}
            />
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1">
        <JsonViewer
          key={focusedResult ? 'focused' : 'default'}
          data={cleanedState}
          containerRef={jsonContainerRef}
          initialCollapseDepth={focusedResult ? 1 : 2}
        />
      </div>
    </div>
  );
};

type ConversationTabProps = {
  conversationData: unknown;
};

const ConversationTab: React.FC<ConversationTabProps> = ({ conversationData }) => {
  return (
    <div className="absolute inset-0 flex flex-col">
      <JsonViewer data={conversationData} />
    </div>
  );
};

const DebugDrawerContent: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const state = useFullState();
  const { messages, status, latestUsage, latestModelId, latestRequestContext } = useChatContext();

  const projectStateData = React.useMemo(() => createProjectStateData(state), [state]);
  const projectStateExportData = React.useMemo(
    () => createProjectStateExportData(state, projectStateData),
    [projectStateData, state],
  );
  const conversationPreviewData = React.useMemo(
    () => ({
      status,
      messagesCount: messages.length,
      subagentEvents: getSubagentDebugEvents(messages),
      messages: messages.map((message) => ({
        id: message.id,
        role: message.role,
        messageIndex: message.messageIndex,
        projectStateWhenSendingMessage: message.projectStateWhenSendingMessage ? '[Project State Attached]' : undefined,
        parts: message.parts,
      })),
    }),
    [messages, status],
  );
  const conversationExportData = React.useMemo(
    () => ({
      status,
      messagesCount: messages.length,
      subagentEvents: getSubagentDebugEvents(messages),
      latestUsage,
      latestModelId,
      latestRequestContext,
      messages,
    }),
    [latestModelId, latestRequestContext, latestUsage, messages, status],
  );

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      <Tooltip delay={1500}>
        <TooltipTrigger asChild>
          <DrawerTrigger asChild>
            <IconButton variant="ghost" size="sm" aria-label="Debug drawer" className="text-white">
              <BugIcon />
            </IconButton>
          </DrawerTrigger>
        </TooltipTrigger>
        <TooltipPanel>Debug drawer (dev only)</TooltipPanel>
      </Tooltip>
      <DrawerContent className="!w-[700px] !max-w-[90vw] overflow-hidden border-l !border-zinc-700 bg-zinc-900">
        <DrawerHeader className="shrink-0 border-b border-zinc-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DrawerTitle>Debug Panel</DrawerTitle>
            <div className="flex items-center gap-2">
              <DebugDownloadButton
                label="State"
                tooltip="Download project state JSON"
                fileNamePrefix="edith-debug-state"
                getData={() => ({ exportedAt: new Date().toISOString(), projectState: projectStateExportData })}
              />
              <DebugDownloadButton
                label="Conversation"
                tooltip="Download conversation JSON with tool calls"
                fileNamePrefix="edith-debug-conversation"
                getData={() => ({ exportedAt: new Date().toISOString(), conversation: conversationExportData })}
              />
              <DebugDownloadButton
                label="Both"
                tooltip="Download project state and conversation in one JSON file"
                fileNamePrefix="edith-debug-snapshot"
                getData={() => ({
                  exportedAt: new Date().toISOString(),
                  projectState: projectStateExportData,
                  conversation: conversationExportData,
                })}
              />
            </div>
          </div>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          <Tabs defaultValue="state" className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <TabsList className="shrink-0">
              <TabsTab value="state">Project State</TabsTab>
              <TabsTab value="conversation">Conversation</TabsTab>
            </TabsList>
            <TabsPanels className="relative mt-4 min-h-0 flex-1 overflow-hidden">
              <TabsPanel value="state" className="absolute inset-0">
                <ProjectStateTab cleanedState={projectStateData} />
              </TabsPanel>
              <TabsPanel value="conversation" className="absolute inset-0">
                <ConversationTab conversationData={conversationPreviewData} />
              </TabsPanel>
            </TabsPanels>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export const DebugDrawer: React.FC = () => {
  const isDevMode = useIsDevMode();

  if (!isDevMode) {
    return null;
  }

  return <DebugDrawerContent />;
};
