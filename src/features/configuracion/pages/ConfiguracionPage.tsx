// ConfiguracionPage — hub de administración del CRM con pestañas.
// Roles y Etiquetas conviven acá (ambos son catálogos de configuración admin).
// El tab activo se sincroniza con ?tab= en la URL (useTabSync), igual que el detalle de trato.

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabSync } from '@/lib/useTabSync';
import { RolesListPage } from '@/features/roles/pages/RolesListPage';
import { EtiquetasListPage } from '@/features/etiquetas/pages/EtiquetasListPage';
import { usePermissions } from '@/features/permissions/context';
import { AccessDeniedView } from '@/features/permissions/components/PermissionState';

export function ConfiguracionPage() {
  const permissions = usePermissions();
  const canRoles = permissions.allows('ROL', 'LEER');
  const canEtiquetas = permissions.allows('ETIQUETA', 'LEER');
  const allowedTabs = [
    ...(canRoles ? (['roles'] as const) : []),
    ...(canEtiquetas ? (['etiquetas'] as const) : []),
  ];
  const fallbackTab = allowedTabs[0] ?? 'roles';
  const [tab, setTab] = useTabSync(allowedTabs, fallbackTab);
  const [rolesCreateOpen, setRolesCreateOpen] = useState(false);
  const [etiquetasCreateOpen, setEtiquetasCreateOpen] = useState(false);

  if (permissions.status === 'resolved' && allowedTabs.length === 0) {
    return <AccessDeniedView />;
  }

  const isRolesTab = tab === 'roles';
  const canCreate = isRolesTab
    ? permissions.allows('ROL', 'ADMINISTRAR')
    : permissions.allows('ETIQUETA', 'CREAR');

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <header className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isRolesTab ? 'Roles' : 'Etiquetas'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRolesTab
              ? 'Gestiona los roles del CRM y sus descripciones.'
              : 'Gestiona las etiquetas que clasifican los tratos y las tareas en los tableros.'}
          </p>
        </div>
        {canCreate && (
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              if (isRolesTab) {
                setRolesCreateOpen(true);
              } else {
                setEtiquetasCreateOpen(true);
              }
            }}
          >
            <Plus data-icon="inline-start" aria-hidden="true" />
            {isRolesTab ? 'Nuevo rol' : 'Nueva etiqueta'}
          </Button>
        )}
      </header>

      <Tabs
        value={tab}
        onValueChange={setTab}
        className="mx-auto w-full max-w-[1400px] gap-6"
      >
        <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0">
          {canRoles && (
            <TabsTrigger
              value="roles"
              className="h-auto flex-none rounded-none border-0 px-1 pb-3 pt-0 text-sm font-medium text-muted-foreground shadow-none after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-primary after:opacity-0 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
            >
              Roles
            </TabsTrigger>
          )}
          {canEtiquetas && (
            <TabsTrigger
              value="etiquetas"
              className="h-auto flex-none rounded-none border-0 px-1 pb-3 pt-0 text-sm font-medium text-muted-foreground shadow-none after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-primary after:opacity-0 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
            >
              Etiquetas
            </TabsTrigger>
          )}
        </TabsList>

        {canRoles && (
          <TabsContent value="roles" className="outline-none">
            <RolesListPage
              embedded
              createOpen={rolesCreateOpen}
              onCreateOpenChange={setRolesCreateOpen}
            />
          </TabsContent>
        )}

        {canEtiquetas && (
          <TabsContent value="etiquetas" className="outline-none">
            <EtiquetasListPage
              embedded
              createOpen={etiquetasCreateOpen}
              onCreateOpenChange={setEtiquetasCreateOpen}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
