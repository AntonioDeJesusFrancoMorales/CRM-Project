import { createBrowserRouter, Navigate } from 'react-router';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { EmpresasListPage } from '@/features/empresas/pages/EmpresasListPage';
import { EmpresaDetailPage } from '@/features/empresas/pages/EmpresaDetailPage';
import { UsuariosListPage } from '@/features/usuarios/pages/UsuariosListPage';
import { ContactosPage } from '@/features/contactos/pages/ContactosPage';
import { ContactoDetailPage } from '@/features/contactos/pages/ContactoDetailPage';
import { TratosListPage } from '@/features/tratos/pages/TratosListPage';
import { TratoDetailPage } from '@/features/tratos/pages/TratoDetailPage';
import { TareasListPage } from '@/features/tareas/pages/TareasListPage';
import { TareaDetailPage } from '@/features/tareas/pages/TareaDetailPage';
import { KanbanListPage } from '@/features/kanban/pages/KanbanListPage';
import { KanbanPage } from '@/features/kanban/pages/KanbanPage';

export const router = createBrowserRouter([
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
          {
            element: <RoleGuard role="admin" />,
            children: [{ path: 'usuarios', element: <UsuariosListPage /> }],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
