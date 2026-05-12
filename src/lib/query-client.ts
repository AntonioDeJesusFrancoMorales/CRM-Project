import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30s — para que los detalles no se refetcheen agresivamente
      retry: (failureCount, error) => {
        // No reintentar en 401 (logout automático ya se disparó) ni 404/422.
        if (error instanceof Error && 'status' in error) {
          const status = (error as { status: number }).status;
          if ([401, 404, 422].includes(status)) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
