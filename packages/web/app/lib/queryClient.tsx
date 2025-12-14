import { QueryClient } from '@tanstack/react-query';

// Query cache configuration constants
const STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes - data stays fresh
const GC_TIME_MS = 10 * 60 * 1000; // 10 minutes - cache retention (formerly cacheTime)
const RETRY_COUNT = 1; // Only retry once on failure

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      gcTime: GC_TIME_MS,
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: false, // Don't refetch on reconnect
      retry: RETRY_COUNT,
    },
  },
});
