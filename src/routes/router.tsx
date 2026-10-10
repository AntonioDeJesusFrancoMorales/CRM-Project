import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { AuthProvider } from '@/features/auth/components/AuthProvider';
import { PermissionsProvider } from '@/features/permissions/context';
import { PermissionRoute } from '@/features/permissions/components/PermissionRoute';
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
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';

function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

function PermissionsLayout() {
  return (
    <PermissionsProvider>
      <Outlet />
    </PermissionsProvider>
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
            element: <PermissionsLayout />,
            children: [
              {
                element: <AppShell />,
                children: [
                  { index: true, element: <DashboardPage /> },
                  {
                    element: <PermissionRoute resource="EMPRESA" />,
                    children: [
                      { path: 'empresas', element: <EmpresasListPage /> },
                      { path: 'empresas/:id', element: <EmpresaDetailPage /> },
                    ],
                  },
                  {
                    element: <PermissionRoute resource="CONTACTO" />,
                    children: [
                      // Nuevas rutas contactos (unifica prospectos + clientes)
                      { path: 'contactos', element: <ContactosPage /> },
                      { path: 'contactos/:id', element: <ContactoDetailPage /> },
                      // Redirects: rutas legacy de lista → /contactos con tab correspondiente
                      { path: 'prospectos', element: <Navigate to="/contactos?tab=PROSPECTO" replace /> },
                      { path: 'clientes', element: <Navigate to="/contactos?tab=ACTIVO" replace /> },
                      { path: 'prospectos/:id', element: <Navigate to="/contactos" replace /> },
                      { path: 'clientes/:id', element: <Navigate to="/contactos" replace /> },
                    ],
                  },
                  {
                    element: <PermissionRoute resource="TRATO" />,
                    children: [
                      { path: 'tratos', element: <TratosListPage /> },
                      { path: 'tratos/:id', element: <TratoDetailPage /> },
                    ],
                  },
                  {
                    element: <PermissionRoute resource="TAREA" />,
                    children: [
                      { path: 'tareas', element: <TareasListPage /> },
                      { path: 'tareas/:id', element: <TareaDetailPage /> },
                    ],
                  },
                  {
                    element: <PermissionRoute resource="TABLERO" />,
                    children: [
                      { path: 'tableros', element: <KanbanListPage /> },
                      { path: 'tableros/:id', element: <KanbanPage /> },
                    ],
                  },
                  {
                    element: <PermissionRoute resource="AGENDA" />,
                    children: [{ path: 'agenda', element: <AgendaListPage /> }],
                  },
                  {
                    element: <PermissionRoute resource="USUARIO" />,
                    children: [{ path: 'usuarios', element: <UsuariosListPage /> }],
                  },
                  {
                    element: (
                      <PermissionRoute
                        anyOf={[
                          { resource: 'ROL', action: 'LEER' },
                          { resource: 'ETIQUETA', action: 'LEER' },
                        ]}
                      />
                    ),
                    children: [{ path: 'configuracion', element: <ConfiguracionPage /> }],
                  },
                ],
              },
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
