import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { del, get, set } from 'idb-keyval';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { gcTime: 1000 * 60 * 60 * 24, retry: 2, networkMode: 'offlineFirst', refetchOnWindowFocus: true },
    mutations: { networkMode: 'online', retry: 1 }, // paused while offline, resumed when back online
  },
});

export const persister = createAsyncStoragePersister({
  key: 'roomie-cache',
  storage: { getItem: (k) => get(k), setItem: (k, v) => set(k, v), removeItem: (k) => del(k) },
});
