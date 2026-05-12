import { createBrowserRouter, Navigate } from 'react-router';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import {
  EmpresasPlaceholder,
  UsuariosPlaceholder,
  ProspectosPlaceholder,
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
          { path: 'empresas', element: <EmpresasPlaceholder /> },
          { path: 'empresas/:id', element: <EmpresasPlaceholder /> },
          { path: 'prospectos', element: <ProspectosPlaceholder /> },
          { path: 'clientes', element: <ClientesPlaceholder /> },
          { path: 'tratos', element: <TratosPlaceholder /> },
          { path: 'tableros', element: <TablerosPlaceholder /> },
          {
            element: <RoleGuard role="admin" />,
            children: [{ path: 'usuarios', element: <UsuariosPlaceholder /> }],
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
