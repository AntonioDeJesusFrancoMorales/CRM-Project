// MSW server para tests con Vitest. Reutiliza los mismos handlers
// que usa el navegador. Los tests pueden hacer `server.use(...)`
// para sobrescribir un handler en un escenario específico.

import { setupServer } from 'msw/node';
import { handlers } from '@/mocks/handlers';

export const server = setupServer(...handlers);
