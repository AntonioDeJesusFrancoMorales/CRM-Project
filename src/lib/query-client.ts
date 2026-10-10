import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30s — para que los detalles no se refetcheen agresivamente
      retry: (failureCount, error) => {
        // No reintentar en auth/permission failures or client validation/not-found responses.
        if (error instanceof Error && 'status' in error) {
          const status = (error as { status: number }).status;
          if ([400, 401, 403, 404, 422].includes(status)) return false;
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
