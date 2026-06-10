// ConfiguracionPage — hub de administración del CRM con pestañas.
// Roles y Etiquetas conviven acá (ambos son catálogos de configuración admin).
// El tab activo se sincroniza con ?tab= en la URL (useTabSync), igual que el detalle de trato.

import { ShieldCheck, Tags } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabSync } from '@/lib/useTabSync';
import { RolesListPage } from '@/features/roles/pages/RolesListPage';
import { EtiquetasListPage } from '@/features/etiquetas/pages/EtiquetasListPage';

export function ConfiguracionPage() {
  const [tab, setTab] = useTabSync(['roles', 'etiquetas'], 'roles');

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-6">
      <TabsList>
        <TabsTrigger value="roles">
          <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" />
          Roles
        </TabsTrigger>
        <TabsTrigger value="etiquetas">
          <Tags className="mr-2 h-4 w-4" aria-hidden="true" />
          Etiquetas
        </TabsTrigger>
      </TabsList>

      <TabsContent value="roles">
        <RolesListPage />
      </TabsContent>

      <TabsContent value="etiquetas">
        <EtiquetasListPage />
      </TabsContent>
    </Tabs>
  );
}
