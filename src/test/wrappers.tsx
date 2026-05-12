// Helpers reutilizables para envolver hooks/componentes con los providers
// que necesitan: QueryClient y Router. Cada test recibe un QueryClient
// aislado (sin cache compartida entre tests).

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';

interface SetupResult {
  queryClient: QueryClient;
  Wrapper: (props: { children: ReactNode }) => JSX.Element;
}

export function setupTestWrapper(initialEntries: string[] = ['/']): SetupResult {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  );

  return { queryClient, Wrapper };
}
