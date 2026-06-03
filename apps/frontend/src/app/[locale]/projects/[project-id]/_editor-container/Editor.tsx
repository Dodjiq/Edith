'use client';

import dynamic from 'next/dynamic';
import type { FC } from 'react';
import { Shimmer } from '../_chatbot/chatbot-components/ai-elements/conversation/shimmer';

import { FastSpinner } from '@/components/loaders/Spinner';

const LoadingFallback = () => {
  return (
    <div className={'flex h-dvh w-full items-center justify-center gap-3'}>
      <Shimmer className="">Loading editor...</Shimmer>
      <FastSpinner />
    </div>
  );
};

const EditorApp = dynamic(
  () =>
    import('./editor/editor').then(async (mod) => {
      return mod.Editor;
    }),
  {
    ssr: false,
    loading: () => <LoadingFallback />,
  },
);

const Editor: FC = () => <EditorApp />;

export default Editor;
