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
    cambiarEstado: (id: string) => `/contactos/cambiar-estado?id=${id}`,
    delete: (id: string) => `/contactos/delete?id=${id}`,
  },
  tratos: {
    getAll: () => '/tratos/get-all',
    getById: (id: string) => `/tratos/get-by-id?id=${id}`,
    create: () => '/tratos/create',
    edit: (id: string) => `/tratos/edit?id=${id}`,
    delete: (id: string) => `/tratos/delete?id=${id}`,
  },
  tableros: {
    getAll: () => '/tableros/get-all',
    getById: (id: string) => `/tableros/get-by-id?id=${id}`,
    create: () => '/tableros/create',
    edit: (id: string) => `/tableros/edit?id=${id}`,
    delete: (id: string) => `/tableros/delete?id=${id}`,
    // asignar-columna: agrega una columna del catálogo (ya creada vía /columnas/create)
    // a un tablero con su config contextual. El back NO tiene un endpoint atómico:
    // el flujo "nueva columna" son 2 pasos (create + asignar) — ver useCrearColumnaEnTablero.
    asignarColumna: (tableroId: string, columnaId: string) =>
      `/tableros/asignar-columna?id=${tableroId}&columnaId=${columnaId}`,
    eliminarColumna: (tableroId: string, columnaId: string) =>
      `/tableros/eliminar-columna?id=${tableroId}&columnaId=${columnaId}`,
    reordenarColumnas: (tableroId: string) => `/tableros/reordenar-columnas?id=${tableroId}`,
  },
  agendas: {
    // get-all-by-user: el back filtra por el usuario autenticado (JWT). Es "mi agenda".
    getAllByUser: () => '/agendas/get-all-by-user',
    getById: (id: string) => `/agendas/get-by-id?id=${id}`,
    create: () => '/agendas/create',
    edit: (id: string) => `/agendas/edit?id=${id}`,
    delete: (id: string) => `/agendas/delete?id=${id}`,
  },
  columnas: {
    getAll: () => '/columnas/get-all',
    getById: (id: string) => `/columnas/get-by-id?id=${id}`,
    create: () => '/columnas/create',
    edit: (id: string) => `/columnas/edit?id=${id}`,
    delete: (id: string) => `/columnas/delete?id=${id}`,
  },
  fichas: {
    getAll: () => '/fichas/get-all',
    create: () => '/fichas/create',
    edit: (id: string) => `/fichas/edit?id=${id}`,
    delete: (id: string) => `/fichas/delete?id=${id}`,
    moverColumna: (id: string) => `/fichas/mover-columna?id=${id}`,
  },
  usuarios: {
    getAll: () => '/usuarios/get-all',
    getById: (id: string) => `/usuarios/get-by-id?id=${id}`,
    create: () => '/usuarios/create',
    edit: (id: string) => `/usuarios/edit?id=${id}`,
    delete: (id: string) => `/usuarios/delete?id=${id}`,
    // Cambio de contraseña del usuario autenticado. NO recibe body: el back deriva el
    // usuarioId del ActorContext (token) y dispara un email de Keycloak (UPDATE_PASSWORD).
    // Responde 202 Accepted sin cuerpo. Ver back UsuarioController.requestPasswordChange.
    requestPasswordChange: () => '/usuarios/request-password-change',
  },
  roles: {
    getAll: () => '/roles/get-all',
    getById: (id: string) => `/roles/get-by-id?id=${id}`,
    create: () => '/roles/create',
    edit: (id: string) => `/roles/edit?id=${id}`,
    delete: (id: string) => `/roles/delete?id=${id}`,
  },
  etiquetas: {
    // get-all admite filtro opcional por tipo (TAREA|TRATO). Sin tipo => catálogo completo.
    getAll: (tipo?: 'TAREA' | 'TRATO') =>
      tipo ? `/etiquetas/get-all?tipoEtiqueta=${tipo}` : '/etiquetas/get-all',
    getById: (id: string) => `/etiquetas/get-by-id?id=${id}`,
    create: () => '/etiquetas/create',
    // edit: el back NO permite cambiar el tipo (inmutable); solo nombre y color.
    edit: (id: string) => `/etiquetas/edit?id=${id}`,
    // delete: si la etiqueta está EN USO, el back exige confirm=true o rechaza con
    // EtiquetaRequiresConfirmationException. Ver EtiquetaDeleteDialog.
    delete: (id: string, confirm = false) =>
      `/etiquetas/delete?id=${id}&confirm=${confirm}`,
  },
  wa: {
    canales: {
      getAll: (empresaId: string) => `/wa/canales/get-all?empresaId=${empresaId}`,
      getAllGlobal: () => '/wa/canales/get-all',
      getById: (id: string) => `/wa/canales/get-by-id?id=${id}`,
      create: () => '/wa/canales/create',
      edit: (id: string) => `/wa/canales/edit?id=${id}`,
      delete: (id: string) => `/wa/canales/delete?id=${id}`,
      conectar: (id: string) => `/wa/canales/conectar?id=${id}`,
      estado: (id: string) => `/wa/canales/estado?id=${id}`,
      syncChats: (canalId: string) => `/wa/canales/sync-chats?canalId=${canalId}`,
      reconfigurarWebhook: (id: string) => `/wa/canales/reconfigurar-webhook?id=${id}`,
    },
    conversaciones: {
      getAll: (empresaId: string) => `/wa/conversaciones/get-all?empresaId=${empresaId}`,
      getById: (id: string) => `/wa/conversaciones/get-by-id?id=${id}`,
      mensajes: (conversacionId: string) => `/wa/conversaciones/${conversacionId}/mensajes`,
      asignar: (id: string, agenteId: string) => `/wa/conversaciones/asignar?id=${id}&agenteId=${agenteId}`,
      cerrar: (id: string) => `/wa/conversaciones/cerrar?id=${id}`,
      reabrir: (id: string) => `/wa/conversaciones/reabrir?id=${id}`,
      marcarLeido: (id: string) => `/wa/conversaciones/marcar-leido?id=${id}`,
      renombrar: (id: string) => `/wa/conversaciones/nombre?id=${id}`,
      // Toggle de bot/handoff desde el panel humano (JWT). Mismo contrato de labels
      // que usa el bot de n8n vía api_access_token — ver BotConversationController.
      labels: (id: string) => `/wa/conversaciones/labels?id=${id}`,
    },
    mensajes: {
      send: (conversacionId: string) => `/wa/mensajes/send?conversacionId=${conversacionId}`,
    },
    grupos: {
      getAll: () => '/wa/grupos/get-all',
      mensajes: (grupoId: string) => `/wa/grupos/${grupoId}/mensajes`,
      send: (grupoId: string) => `/wa/grupos/${grupoId}/mensajes`,
      importar: (canalId: string) => `/wa/grupos/importar?canalId=${canalId}`,
      marcarLeido: (grupoId: string) => `/wa/grupos/${grupoId}/marcar-leido`,
    },
    ajustes: () => '/wa/ajustes',
    plantillas: {
      getAll: () => '/wa/plantillas/get-all',
      create: () => '/wa/plantillas/create',
      delete: (id: string) => `/wa/plantillas/delete?id=${id}`,
    },
    stream: () => '/wa/stream',
  },
  bots: {
    getAll: () => '/bots',
    getById: (id: string) => `/bots/${id}`,
    create: () => '/bots',
    edit: (id: string) => `/bots/${id}`,
    delete: (id: string) => `/bots/${id}`,
    activar: (id: string) => `/bots/${id}/activar`,
    desactivar: (id: string) => `/bots/${id}/desactivar`,
  },
  media: {
    upload: () => '/media/upload',
  },
} as const;
