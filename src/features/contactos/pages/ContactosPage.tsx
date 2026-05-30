import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Contacto } from '@/api/types';
import { useContactos } from '../hooks/useContactos';
import { ContactosTable } from '../components/ContactosTable';
import { ContactoFormDialog } from '../components/ContactoFormDialog';
import { ContactoDeleteDialog } from '../components/ContactoDeleteDialog';

type EstadoRelacion = 'PROSPECTO' | 'ACTIVO' | 'INACTIVO';

const TABS: { value: EstadoRelacion; label: string }[] = [
  { value: 'PROSPECTO', label: 'Prospecto' },
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'INACTIVO', label: 'Inactivo' },
];

const DEFAULT_TAB: EstadoRelacion = 'PROSPECTO';

function isEstadoRelacion(value: string | null): value is EstadoRelacion {
  return value === 'PROSPECTO' || value === 'ACTIVO' || value === 'INACTIVO';
}

export function ContactosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: EstadoRelacion = isEstadoRelacion(rawTab) ? rawTab : DEFAULT_TAB;

  const { data: contactos, isLoading, isError, refetch } = useContactos();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Contacto | null>(null);
  const [deleting, setDeleting] = useState<Contacto | null>(null);

  function handleTabChange(value: string) {
    setSearchParams({ tab: value }, { replace: true });
  }

  const filtered = contactos?.filter((c) => c.estadoRelacion === activeTab) ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contactos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona prospectos, clientes activos e inactivos.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Nuevo contacto
        </Button>
      </header>

      {isLoading && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Cargando contactos...
        </p>
      )}

      {isError && (
        <div className="py-12 flex flex-col items-center gap-4">
          <p className="text-sm text-destructive">
            No fue posible cargar los contactos. Intenta de nuevo.
          </p>
          <Button variant="outline" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              <div className="rounded-md border">
                <ContactosTable
                  contactos={tab.value === activeTab ? filtered : []}
                  onEdit={(c) => setEditing(c)}
                  onDelete={(c) => setDeleting(c)}
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      <ContactoFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {editing && (
        <ContactoFormDialog
          mode="edit"
          contacto={editing}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      )}

      <ContactoDeleteDialog
        contacto={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </div>
  );
}
