'use client';

import type { RefObject } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { PlayerRef } from '@remotion/player';
import type { ChatMode } from 'api-types';
import type { PromptInputMessage } from '@/app/[locale]/projects/[project-id]/_chatbot/chatbot-components/ai-elements/prompt-input/prompt-input';
import { useChatContext } from './context/ChatContext';
import { useChatDraftStore } from './stores/chat-draft-store';
import { getChatInteractionLockState } from './utils/chat-activity';
import { usePresetManager } from './hooks/usePresetManager';
import { ChatbotHeader } from './chatbot-components/ChatbotHeader';
import { ChatbotConversation } from './chatbot-components/ChatbotConversation';
import { ChatbotPlan } from './chatbot-components/ChatbotPlan';
import { ChatbotPromptInput } from './chatbot-components/ChatbotPromptInput';
import { PresetPanel, type Preset } from './chatbot-components/PresetPanel';
import {
  Suggestion,
  Suggestions,
  AddPresetSuggestion,
} from '@/app/[locale]/projects/[project-id]/_chatbot/chatbot-components/ai-elements/suggestion/suggestion';
import { Tabs, TabsPanel, TabsPanels } from '@/components/tabs/tabs';
import {
  useAssetStatus,
  useAssets,
  useDimensions,
  useFps,
  useAllItems,
  useSelectedItems,
  useTimelineContext,
  useTracks,
} from '../_editor-container/editor/utils/use-context';
import { useLibraryAssets } from '../_editor-container/editor/library';
import useBuildProjectState from './hooks/useBuildProjectState';
import { usePlanState } from './hooks/usePlanState';

type ChatTab = 'chat' | 'preset';

type ChatbotProps = {
  playerRef?: RefObject<PlayerRef | null>;
};

const Chatbot: React.FC<ChatbotProps> = ({ playerRef }) => {
  const [isMacOs] = useState<boolean>(() => typeof window !== 'undefined' && /mac/i.test(navigator.userAgent));
  const [mode, setMode] = useState<ChatMode>('fast');
  const [isModeInitialized, setIsModeInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<ChatTab>('chat');
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState<boolean>(false);
  const { presets, addPreset, updatePreset, deletePreset } = usePresetManager();

  const draftInput = useChatDraftStore((state) => state.draftInput);
  const setDraftInput = useChatDraftStore((state) => state.setDraftInput);
  const clearDraftInput = useChatDraftStore((state) => state.clearDraftInput);

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState warning
    const timeoutId = setTimeout(() => {
      const savedMode = localStorage.getItem('chat-mode');
      if (savedMode) {
        setMode(savedMode as ChatMode);
      }
      setIsModeInitialized(true);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (isModeInitialized) {
      localStorage.setItem('chat-mode', mode);
    }
  }, [mode, isModeInitialized]);

  const { messages, sendMessage, status, regenerate, stop, isStopping, resetConversation } = useChatContext();
  const planState = usePlanState(messages);
  const isChatBusy = Boolean(getChatInteractionLockState({ status, isStopping }));

  const timelineContext = useTimelineContext();
  const dimensionsContext = useDimensions();
  const projectsAssets = useAssets();
  const libraryAssets = useLibraryAssets();
  const assetsStatus = useAssetStatus();
  const tracks = useTracks();
  const selectedItems = useSelectedItems();
  const fps = useFps();
  const items = useAllItems();
  const projectStateDigest = useBuildProjectState({
    timelineContext,
    dimensionsContext,
    projectsAssets,
    libraryAssets,
    assetsStatus,
    tracks,
    selectedItems,
    fps,
    items,
    playerRef,
  });

  const handlePromptSubmit = (message: PromptInputMessage) => {
    const trimmedText = message.text?.trim() ?? '';

    if (!trimmedText) {
      alert('Please enter a message');
      return;
    }

    if (isChatBusy) {
      alert('Please wait for the current message to finish');
      return;
    }

    void sendMessage({
      text: trimmedText,
      projectStateWhenSendingMessage: projectStateDigest,
      mode,
    });
    clearDraftInput();
  };

  const latestMessageId = messages.at(-1)?.id;
  const handleInputChange = (value: string) => setDraftInput(value);

  const handleRegenerate = useCallback(() => {
    regenerate(projectStateDigest);
  }, [projectStateDigest, regenerate]);

  const handleResetConversation = useCallback(() => {
    setActiveTab('chat');
    clearDraftInput();
    void resetConversation();
  }, [clearDraftInput, resetConversation]);

  const handleAddPresetClick = useCallback(() => {
    setActiveTab('preset');
    setIsPresetDialogOpen(true);
  }, []);

  const handlePresetClick = useCallback(
    (preset: Preset) => {
      if (isChatBusy) {
        return;
      }

      void sendMessage({ text: preset.prompt, projectStateWhenSendingMessage: projectStateDigest, mode });
      clearDraftInput();
    },
    [clearDraftInput, isChatBusy, sendMessage, projectStateDigest, mode],
  );

  const handleShortcut = useCallback(
    (event: KeyboardEvent) => {
      const isModifierPressed = isMacOs ? event.metaKey && event.altKey : event.ctrlKey && event.altKey;

      // Use event.code instead of event.key because Option key on macOS transforms the character
      // (e.g., Option + T produces "†" instead of "t")
      if (!isModifierPressed || event.code !== 'KeyT') {
        return;
      }

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isContentEditable = target?.isContentEditable;

      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || isContentEditable) {
        return;
      }

      event.preventDefault();
      handleResetConversation();
    },
    [handleResetConversation, isMacOs],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleShortcut);

    return () => {
      window.removeEventListener('keydown', handleShortcut);
    };
  }, [handleShortcut]);

  return (
    <div className="bg-editor-starter-panel sticky top-0 flex h-screen min-w-[400px] max-w-[400px] flex-col border-l-2 border-zinc-800 px-4 py-2">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ChatTab)} className="flex h-full flex-col">
        <ChatbotHeader onNewChat={handleResetConversation} />
        <TabsPanels mode="layout" className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <TabsPanel value="chat" className="flex h-full flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-hidden">
              <ChatbotConversation
                messages={messages}
                status={status}
                latestMessageId={latestMessageId}
                onRegenerate={handleRegenerate}
              />
            </div>
            <div className="shrink-0 space-y-3 pt-1">
              <ChatbotPlan plan={planState} />
              {messages.length === 0 && (
                <Suggestions aria-label="Preset suggestions">
                  {presets.map((preset) => (
                    <Suggestion
                      disabled={isChatBusy}
                      key={preset.id}
                      onClick={() => handlePresetClick(preset)}
                      suggestion={preset.title.length > 50 ? `${preset.title.slice(0, 50)}...` : preset.title}
                    />
                  ))}
                  <AddPresetSuggestion onClick={handleAddPresetClick} />
                </Suggestions>
              )}
              <ChatbotPromptInput
                value={draftInput}
                status={status}
                mode={mode}
                isStopping={isStopping}
                onInputChange={handleInputChange}
                onModeChange={setMode}
                onSubmit={handlePromptSubmit}
                onStop={stop}
              />
            </div>
          </TabsPanel>
          <TabsPanel value="preset" className="h-full">
            <PresetPanel
              presets={presets}
              isDialogOpen={isPresetDialogOpen}
              onDialogOpenChange={setIsPresetDialogOpen}
              onAddPreset={addPreset}
              onUpdatePreset={updatePreset}
              onDeletePreset={deletePreset}
            />
          </TabsPanel>
        </TabsPanels>
      </Tabs>
    </div>
  );
};

export default Chatbot;
