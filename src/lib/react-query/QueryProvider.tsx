'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider, type Persister } from '@tanstack/react-query-persist-client';
import { get, set, del } from 'idb-keyval';

// إنشاء IndexedDB Persister مخصص لتخزين الكاش بدون قيود حجم localStorage
function createIdbPersister(idbKey: string = 'refaaq_react_query_cache'): Persister {
  return {
    persistClient: async (client) => {
      try {
        await set(idbKey, client);
      } catch (error) {
        console.warn('فشل في حفظ الكاش محلياً:', error);
      }
    },
    restoreClient: async () => {
      try {
        return await get(idbKey);
      } catch (error) {
        console.warn('فشل في استرجاع الكاش المحلي:', error);
        return undefined;
      }
    },
    removeClient: async () => {
      try {
        await del(idbKey);
      } catch (error) {
        console.warn('فشل في مسح الكاش المحلي:', error);
      }
    },
  };
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // كاش طويل الأمد لتمكين الاستخدام دون اتصال (Offline-first)
            staleTime: 1000 * 60 * 15, // 15 دقيقة
            gcTime: 1000 * 60 * 60 * 24 * 7, // 7 أيام في الذاكرة المحلية
            networkMode: 'offlineFirst',
            retry: 2,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
          mutations: {
            networkMode: 'offlineFirst',
            retry: 1,
          },
        },
      })
  );

  const [persister, setPersister] = useState<Persister | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPersister(createIdbPersister());
    }
  }, []);

  if (!persister) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24 * 7, // صالح لمدة أسبوع بدون اتصال
        buster: 'v1.0.0',
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
