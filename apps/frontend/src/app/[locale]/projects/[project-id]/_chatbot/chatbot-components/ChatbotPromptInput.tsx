'use client';

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/app/[locale]/projects/[project-id]/_chatbot/chatbot-components/ai-elements/prompt-input/prompt-input';
import type { ChangeEvent, FC, KeyboardEvent } from 'react';
import type { ChatMode } from 'api-types';

import type { ChatStatus } from '../types/chatbot';
import { ChatModeSelector } from './ChatModeSelector';

type ChatbotPromptInputProps = {
  value: string;
  status: ChatStatus;
  mode: ChatMode;
  onInputChange: (value: string) => void;
  onModeChange: (mode: ChatMode) => void;
  onSubmit: (message: PromptInputMessage) => void;
  onStop: () => void | Promise<void>;
  isStopping: boolean;
};

export const ChatbotPromptInput: FC<ChatbotPromptInputProps> = ({
  value,
  status,
  mode,
  onInputChange,
  onModeChange,
  onSubmit,
  onStop,
  isStopping,
}) => {
  const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(event.target.value);
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (status === 'streaming' || status === 'submitting') {
      return;
    }

    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  const isStreaming = status === 'streaming';
  const isSubmitDisabled = status === 'submitting' || (!value.trim() && (status === 'idle' || status === 'submitted'));
  const submitButtonDisabled = isStreaming ? isStopping : isSubmitDisabled;

  return (
    <PromptInput onSubmit={onSubmit} className="mt-2">
      <PromptInputBody>
        <PromptInputTextarea
          className="min-h-[72px] py-2"
          onChange={handleTextareaChange}
          onKeyDown={handleTextareaKeyDown}
          value={value}
          placeholder="Ask the AI assistant to edit your video..."
        />
      </PromptInputBody>
      <PromptInputFooter className="flex items-center justify-between gap-3">
        <ChatModeSelector mode={mode} onModeChange={onModeChange} disabled={status === 'streaming'} />
        <PromptInputSubmit isStopping={isStopping} onStop={onStop} status={status} disabled={submitButtonDisabled} />
      </PromptInputFooter>
    </PromptInput>
  );
};
