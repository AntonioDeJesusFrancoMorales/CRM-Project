import { http, HttpResponse } from 'msw';
import { withDelay } from '@/mocks/utils/withDelay';
import { rolesFixture } from '@/mocks/fixtures/roles';

const API = '/api';

export const rolesHandlers = [
  // GET /api/roles/get-all — retorna lista completa de roles
  http.get(`${API}/roles/get-all`, async () => {
    await withDelay();
    return HttpResponse.json(rolesFixture);
  }),
];
