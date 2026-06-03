'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useChat } from '../hooks/useChat';
import type { UseChatReturn } from '../types/chatbot';

type ChatContextValue = UseChatReturn;

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const chatState = useChat();

  const value = useMemo(() => chatState, [chatState]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = (): UseChatReturn => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }

  return context;
};
