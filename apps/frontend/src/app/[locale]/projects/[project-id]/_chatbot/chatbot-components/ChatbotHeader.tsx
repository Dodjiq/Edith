'use client';

import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { IconButton } from '@/components/buttons/IconButton';
import { TabsList, TabsTab } from '@/components/tabs/tabs';
import { Tooltip, TooltipPanel, TooltipTrigger } from '@/components/tooltip';

type ChatbotHeaderProps = {
  onNewChat: () => void;
};

export const ChatbotHeader: React.FC<ChatbotHeaderProps> = ({ onNewChat }) => {
  const t = useTranslations('projects_editor.chatbot');

  return (
    <div className="mb-2 flex items-center gap-2">
      <TabsList className="min-w-0 flex-1">
        <TabsTab value="chat">{t('tab_chat')}</TabsTab>
        <TabsTab value="preset">{t('tab_preset')}</TabsTab>
      </TabsList>
      <Tooltip>
        <TooltipTrigger asChild>
          <IconButton
            type="button"
            size="sm"
            variant="ghost"
            aria-label={t('new_chat_aria')}
            className="text-zinc-300 hover:text-zinc-50"
            onClick={onNewChat}
          >
            <PlusIcon className="size-4" />
          </IconButton>
        </TooltipTrigger>
        <TooltipPanel>{t('new_chat')}</TooltipPanel>
      </Tooltip>
    </div>
  );
};
