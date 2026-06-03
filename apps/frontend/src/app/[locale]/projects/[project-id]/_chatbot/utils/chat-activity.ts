'use client';

import type { ChatStatus } from '../types/chatbot';

export type ChatInteractionLockState =
  | {
      phase: 'preparing' | 'working' | 'stopping';
      message: string;
    }
  | null;

export const getChatInteractionLockState = ({
  status,
  isStopping,
}: {
  status: ChatStatus;
  isStopping: boolean;
}): ChatInteractionLockState => {
  if (isStopping) {
    return {
      phase: 'stopping',
      message: 'Editing is paused while the assistant wraps up the current response.',
    };
  }

  if (status === 'submitting') {
    return {
      phase: 'preparing',
      message: 'Editing is paused while the assistant gets your request ready.',
    };
  }

  if (status === 'streaming') {
    return {
      phase: 'working',
      message: 'Editing is paused while the assistant works through your request.',
    };
  }

  return null;
};
