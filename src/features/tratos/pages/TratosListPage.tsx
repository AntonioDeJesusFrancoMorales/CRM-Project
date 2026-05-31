// TratosListPage — lista plana de tratos con tabs Lista/Kanban.
// Búsqueda client-side por nombre. Sin filtros estado/cliente/prospecto/responsable.
// Resolución de contactos para TratosTable vía useContactos().
// Tab "Lista" = tabla + búsqueda. Tab "Kanban" = KanbanTabContent tipo="TRATOS".
// useTabSync sincroniza el tab activo con ?tab= en la URL (URL limpia cuando activo = "kanban" — default).

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabSync } from '@/lib/useTabSync';
import { useTratos } from '../hooks/useTratos';
import { useContactos } from '@/features/contactos/hooks/useContactos';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { TratosTable } from '../components/TratosTable';
import { TratoCreateDialog } from '../components/TratoCreateDialog';
import { KanbanTabContent } from '@/features/kanban/components/KanbanTabContent';

export function TratosListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const [tab, setTab] = useTabSync(['lista', 'kanban'], 'kanban');

  const { data: tratos, isLoading, isError, refetch } = useTratos();
  const { data: contactos = [] } = useContactos();
  const { data: usuarios = [] } = useUsuarios();

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tratos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los tratos comerciales del CRM.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Nuevo trato
        </Button>
      </header>

      {/* Tabs Lista / Kanban */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>

        {/* Tab Lista: búsqueda + tabla actual */}
        <TabsContent value="lista" className="mt-4 space-y-4">
          {/* Barra de búsqueda */}
          <div className="flex items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                aria-label="Buscar tratos"
              />
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Cargando tratos...
            </p>
          )}

          {/* Error */}
          {isError && (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-destructive">
                No fue posible cargar los tratos. Intenta de nuevo.
              </p>
              <Button variant="outline" onClick={() => void refetch()}>
                Reintentar
              </Button>
            </div>
          )}

          {/* Tabla */}
          {!isLoading && !isError && tratos && (
            <div className="rounded-md border">
              <TratosTable
                tratos={tratos}
                contactos={contactos}
                usuarios={usuarios}
                searchTerm={searchTerm}
              />
            </div>
          )}
        </TabsContent>

        {/* Tab Kanban: KanbanTabContent tipo TRATOS */}
        <TabsContent value="kanban" className="mt-4">
          <KanbanTabContent tipo="TRATOS" />
        </TabsContent>
      </Tabs>

      {/* Dialog crear trato */}
      <TratoCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
