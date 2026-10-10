// ConfiguracionPage — hub de administración del CRM con pestañas.
// Roles y Etiquetas conviven acá (ambos son catálogos de configuración admin).
// El tab activo se sincroniza con ?tab= en la URL (useTabSync), igual que el detalle de trato.

import { ShieldCheck, Tags } from 'lucide-react';
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

  if (permissions.status === 'resolved' && allowedTabs.length === 0) {
    return <AccessDeniedView />;
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-6">
      <TabsList>
        {canRoles && (
          <TabsTrigger value="roles">
            <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" />
            Roles
          </TabsTrigger>
        )}
        {canEtiquetas && (
          <TabsTrigger value="etiquetas">
            <Tags className="mr-2 h-4 w-4" aria-hidden="true" />
            Etiquetas
          </TabsTrigger>
        )}
      </TabsList>

      {canRoles && (
        <TabsContent value="roles">
          <RolesListPage />
        </TabsContent>
      )}

      {canEtiquetas && (
        <TabsContent value="etiquetas">
          <EtiquetasListPage />
        </TabsContent>
      )}
    </Tabs>
  );
}
