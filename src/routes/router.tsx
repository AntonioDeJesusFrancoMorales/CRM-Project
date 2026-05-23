import { createBrowserRouter, Navigate } from 'react-router';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { EmpresasListPage } from '@/features/empresas/pages/EmpresasListPage';
import { EmpresaDetailPage } from '@/features/empresas/pages/EmpresaDetailPage';
import { ProspectosListPage } from '@/features/prospectos/pages/ProspectosListPage';
import { ProspectoDetailPage } from '@/features/prospectos/pages/ProspectoDetailPage';
import { UsuariosListPage } from '@/features/usuarios/pages/UsuariosListPage';
import {
  ClientesPlaceholder,
  TratosPlaceholder,
  TablerosPlaceholder,
} from './placeholders';

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
          { path: 'prospectos', element: <ProspectosListPage /> },
          { path: 'prospectos/:id', element: <ProspectoDetailPage /> },
          { path: 'clientes', element: <ClientesPlaceholder /> },
          { path: 'tratos', element: <TratosPlaceholder /> },
          { path: 'tableros', element: <TablerosPlaceholder /> },
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
