'use client';

import { useState } from 'react';
import type { ChatMode } from 'api-types';
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorTrigger,
} from '@/app/projects/[project-id]/_chatbot/chatbot-components/ai-elements/model-selector';
import { cn } from '@/lib/utils';
import { Zap, Brain, Check, Scale, Crown } from 'lucide-react';

type ModeConfig = {
  id: ChatMode;
  label: string;
  description: string;
  icon: typeof Zap;
};

const modes: ModeConfig[] = [
  {
    id: 'fast',
    label: 'Fast',
    description: 'Fast AI model, ideal for simple tasks and rapid iteration.',
    icon: Zap,
  },
  {
    id: 'normal',
    label: 'Normal',
    description: 'Balanced AI model for everyday tasks.',
    icon: Scale,
  },
  {
    id: 'smart',
    label: 'Smart',
    description: 'Slower but smarter AI model, best for complex tasks.',
    icon: Brain,
  },
  {
    id: 'pro',
    label: 'Pro',
    description: 'Most powerful AI model with extended thinking for the hardest tasks.',
    icon: Crown,
  },
];

type ChatModeSelectorProps = {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  disabled?: boolean;
};

export const ChatModeSelector: React.FC<ChatModeSelectorProps> = ({ mode, onModeChange, disabled }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const selectedMode = modes.find((m) => m.id === mode) ?? modes[0];
  const SelectedIcon = selectedMode.icon;

  const handleSelect = (selectedModeId: ChatMode) => {
    onModeChange(selectedModeId);
    setIsOpen(false);
  };

  return (
    <ModelSelector open={isOpen} onOpenChange={setIsOpen}>
      <ModelSelectorTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 transition-colors',
            'hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50',
            'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700',
          )}
        >
          <SelectedIcon className="size-3.5" />
          <span>{selectedMode.label}</span>
        </button>
      </ModelSelectorTrigger>
      <ModelSelectorContent title="Select Mode" className="max-w-xs border-none">
        <ModelSelectorList className="px-2 pb-2 pt-10">
          {modes.map((modeItem) => {
            const Icon = modeItem.icon;
            const isSelected = modeItem.id === mode;

            return (
              <ModelSelectorItem
                key={modeItem.id}
                value={modeItem.id}
                onSelect={() => handleSelect(modeItem.id)}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2"
              >
                <Icon className="size-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium">{modeItem.label}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{modeItem.description}</span>
                </div>
                {isSelected && <Check className="size-4 shrink-0 text-emerald-500" />}
              </ModelSelectorItem>
            );
          })}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
};
