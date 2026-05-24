'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import api from '@/utils/services/api-frontend';
import WebSocketProvider from './WebSocketProvider';
import { ReactNode, useState } from 'react';
import { FastSpinner } from '@/components/loaders/Spinner';
import { Suspense } from 'react';

const LoadingFallback = () => {
  return (
    <div className={'flex h-dvh w-full items-center justify-center'}>
      <FastSpinner />
    </div>
  );
};

const Provider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState<QueryClient>(() => new QueryClient());

  return (
    <Suspense fallback={<LoadingFallback />}>
      <NuqsAdapter>
        <QueryClientProvider client={queryClient}>
          <api.ReactQueryProvider>
            <WebSocketProvider>{children}</WebSocketProvider>
          </api.ReactQueryProvider>
        </QueryClientProvider>
      </NuqsAdapter>
    </Suspense>
  );
};

export default Provider;
