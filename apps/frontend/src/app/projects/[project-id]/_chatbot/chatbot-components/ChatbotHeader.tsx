import { PlusIcon } from 'lucide-react';

import { IconButton } from '@/components/buttons/IconButton';
import { TabsList, TabsTab } from '@/components/tabs/tabs';
import { Tooltip, TooltipPanel, TooltipTrigger } from '@/components/tooltip';

type ChatbotHeaderProps = {
  onNewChat: () => void;
};

export const ChatbotHeader: React.FC<ChatbotHeaderProps> = ({ onNewChat }) => (
  <div className="mb-2 flex items-center gap-2">
    <TabsList className="min-w-0 flex-1">
      <TabsTab value="chat">Chat</TabsTab>
      <TabsTab value="preset">Preset</TabsTab>
    </TabsList>
    <Tooltip>
      <TooltipTrigger asChild>
        <IconButton
          type="button"
          size="sm"
          variant="ghost"
          aria-label="New chat"
          className="text-zinc-300 hover:text-zinc-50"
          onClick={onNewChat}
        >
          <PlusIcon className="size-4" />
        </IconButton>
      </TooltipTrigger>
      <TooltipPanel>New chat</TooltipPanel>
    </Tooltip>
  </div>
);
