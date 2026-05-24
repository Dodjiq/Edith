import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/buttons/button';
import { Textarea } from '@/components/inputs/textarea';

import { useChatDraftStore } from '../../../../_chatbot/stores/chat-draft-store';
import { EditorStarterItem } from '../../items/item-type';
import { useAllItems, useFps, useTracks } from '../../utils/use-context';
import { getTrackIndexOfItem } from '../utils/get-track-index-of-item';

type TimelineItemAiEditPopoverProps = {
  targetItemIds: string[];
  onClose: () => void;
};

type TimelineItemEditContext = {
  fps: number;
  items: Array<{
    id: string;
    type: EditorStarterItem['type'];
    trackId: string | null;
    trackIndex: number;
    fromFrame: number;
    toFrame: number;
    startTimeInSeconds: number;
    endTimeInSeconds: number;
  }>;
};

const buildEditWithAiPrompt = ({ prompt, context }: { prompt: string; context: TimelineItemEditContext }): string => {
  return `${prompt}\n\n\`\`\`timeline-items\n${JSON.stringify(context, null, 2)}\n\`\`\``;
};

export const TimelineItemAiEditPopover: React.FC<TimelineItemAiEditPopoverProps> = ({ targetItemIds, onClose }) => {
  const [prompt, setPrompt] = useState<string>('');
  const { items } = useAllItems();
  const { tracks } = useTracks();
  const { fps } = useFps();

  const context = useMemo<TimelineItemEditContext>(() => {
    const timelineItems = targetItemIds
      .map((itemId) => items[itemId])
      .filter((item): item is EditorStarterItem => Boolean(item))
      .map((item) => {
        const trackIndex = getTrackIndexOfItem({ itemId: item.id, tracks });
        const trackId = trackIndex >= 0 ? (tracks[trackIndex]?.id ?? null) : null;
        const fromFrame = item.from;
        const toFrame = item.from + item.durationInFrames;
        const startTimeInSeconds = fromFrame / fps;
        const endTimeInSeconds = toFrame / fps;

        return {
          id: item.id,
          type: item.type,
          trackId,
          trackIndex,
          fromFrame,
          toFrame,
          startTimeInSeconds,
          endTimeInSeconds,
        };
      });

    return {
      fps,
      items: timelineItems,
    };
  }, [fps, items, targetItemIds, tracks]);

  const handleConfirm = useCallback(() => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      return;
    }

    const nextInput = buildEditWithAiPrompt({
      prompt: trimmedPrompt,
      context,
    });

    useChatDraftStore.getState().setDraftInput(nextInput);
    setPrompt('');
    onClose();
  }, [context, onClose, prompt]);

  const confirmDisabled = targetItemIds.length === 0 || !prompt.trim();

  return (
    <div className="space-y-2">
      <Textarea
        autoFocus
        value={prompt}
        onChange={(e) => setPrompt(e.currentTarget.value)}
        placeholder="Ask what you want to do with this items..."
        className="min-h-[92px] resize-none border-neutral-700 bg-neutral-800/50 text-zinc-100 placeholder:text-zinc-500"
      />
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={handleConfirm}
          disabled={confirmDisabled}
          className="bg-editor-starter-accent hover:bg-editor-starter-accent/90 text-white"
        >
          Confirm
        </Button>
      </div>
    </div>
  );
};
