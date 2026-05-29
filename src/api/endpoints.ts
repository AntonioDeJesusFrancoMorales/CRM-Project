// Fuente única de verdad de rutas RPC del back.
// El prefijo /api vive en BASE_URL del cliente; estas rutas son relativas.

export const endpoints = {
  empresas: {
    getAll: () => '/empresas/get-all',
    create: () => '/empresas/create',
    edit: (id: string) => `/empresas/edit?id=${id}`,
    delete: (id: string) => `/empresas/delete?id=${id}`,
  },
  tareas: {
    getAll: () => '/tareas/get-all',
    getById: (id: string) => `/tareas/get-by-id?id=${id}`,
    create: () => '/tareas/create',
    edit: (id: string) => `/tareas/edit?id=${id}`,
    delete: (id: string) => `/tareas/delete?id=${id}`,
  },
  contactos: {
    getAll: () => '/contactos/get-all',
    getById: (id: string) => `/contactos/get-by-id?id=${id}`,
    create: () => '/contactos/create',
    edit: (id: string) => `/contactos/edit?id=${id}`,
    delete: (id: string) => `/contactos/delete?id=${id}`,
  },
} as const;
