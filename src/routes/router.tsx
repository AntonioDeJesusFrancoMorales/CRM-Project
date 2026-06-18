import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { AuthProvider } from '@/features/auth/components/AuthProvider';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { EmpresasListPage } from '@/features/empresas/pages/EmpresasListPage';
import { EmpresaDetailPage } from '@/features/empresas/pages/EmpresaDetailPage';
import { UsuariosListPage } from '@/features/usuarios/pages/UsuariosListPage';
import { ConfiguracionPage } from '@/features/configuracion/pages/ConfiguracionPage';
import { ContactosPage } from '@/features/contactos/pages/ContactosPage';
import { ContactoDetailPage } from '@/features/contactos/pages/ContactoDetailPage';
import { TratosListPage } from '@/features/tratos/pages/TratosListPage';
import { TratoDetailPage } from '@/features/tratos/pages/TratoDetailPage';
import { TareasListPage } from '@/features/tareas/pages/TareasListPage';
import { TareaDetailPage } from '@/features/tareas/pages/TareaDetailPage';
import { KanbanListPage } from '@/features/kanban/pages/KanbanListPage';
import { KanbanPage } from '@/features/kanban/pages/KanbanPage';
import { AgendaListPage } from '@/features/agenda/pages/AgendaListPage';
import { WhatsappChatPage } from '@/features/whatsapp/pages/WhatsappChatPage';
import { WhatsappCanalesPage } from '@/features/whatsapp/pages/WhatsappCanalesPage';
import { WhatsappGruposPage } from '@/features/whatsapp/pages/WhatsappGruposPage';
import { WhatsappAjustesPage } from '@/features/whatsapp/pages/WhatsappAjustesPage';
import { WhatsappPlantillasPage } from '@/features/whatsapp/pages/WhatsappPlantillasPage';

function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppShell />,
            children: [
              { index: true, element: <Navigate to="/empresas" replace /> },
              { path: 'empresas', element: <EmpresasListPage /> },
              { path: 'empresas/:id', element: <EmpresaDetailPage /> },
              // Nuevas rutas contactos (unifica prospectos + clientes)
              { path: 'contactos', element: <ContactosPage /> },
              { path: 'contactos/:id', element: <ContactoDetailPage /> },
              // Redirects: rutas legacy de lista → /contactos con tab correspondiente
              { path: 'prospectos', element: <Navigate to="/contactos?tab=PROSPECTO" replace /> },
              { path: 'clientes', element: <Navigate to="/contactos?tab=ACTIVO" replace /> },
              { path: 'prospectos/:id', element: <Navigate to="/contactos" replace /> },
              { path: 'clientes/:id', element: <Navigate to="/contactos" replace /> },
              { path: 'tratos', element: <TratosListPage /> },
              { path: 'tratos/:id', element: <TratoDetailPage /> },
              { path: 'tareas', element: <TareasListPage /> },
              { path: 'tareas/:id', element: <TareaDetailPage /> },
              { path: 'tableros', element: <KanbanListPage /> },
              { path: 'tableros/:id', element: <KanbanPage /> },
              { path: 'agenda', element: <AgendaListPage /> },
              { path: 'whatsapp', element: <WhatsappChatPage /> },
              { path: 'whatsapp/grupos', element: <WhatsappGruposPage /> },
              { path: 'whatsapp/canales', element: <WhatsappCanalesPage /> },
              { path: 'whatsapp/ajustes', element: <WhatsappAjustesPage /> },
              { path: 'whatsapp/plantillas', element: <WhatsappPlantillasPage /> },
              // /usuarios y /configuracion NO van detrás de un guard de rol:
              // el back no enforza autorización por rol (solo autenticación), así que
              // gatear acá sería falsa seguridad. Cualquier autenticado accede, igual
              // que a la API. Ver capability frontend-authorization.
              { path: 'usuarios', element: <UsuariosListPage /> },
              { path: 'configuracion', element: <ConfiguracionPage /> },
            ],
          },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
