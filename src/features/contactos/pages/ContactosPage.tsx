// ContactosPage — lista de contactos con tabs por estadoRelación.
// KPIs derivados de la lista: Total, Activos, Prospectos (ocultos en error).
// TableSkeleton durante loading. Tabla vacía muestra mensaje interno cuando el tab no tiene contactos.
// Los tabs filtran client-side; la lista completa viene de useContactos().

import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Plus, Search, Users, TrendingUp, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
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

/** KPIs de la cartera de contactos calculados con la lista plana. */
function computeKpis(contactos: Contacto[]) {
  const total = contactos.length;
  const activos = contactos.filter((c) => c.estadoRelacion === 'ACTIVO').length;
  const prospectos = contactos.filter(
    (c) => c.estadoRelacion === 'PROSPECTO',
  ).length;
  return { total, activos, prospectos };
}

export function ContactosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: EstadoRelacion = isEstadoRelacion(rawTab) ? rawTab : DEFAULT_TAB;

  const [searchTerm, setSearchTerm] = useState('');

  const { data: contactos, isLoading, isError, refetch } = useContactos();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Contacto | null>(null);
  const [deleting, setDeleting] = useState<Contacto | null>(null);

  const kpis = useMemo(() => computeKpis(contactos ?? []), [contactos]);

  function handleTabChange(value: string) {
    setSearchParams({ tab: value }, { replace: true });
  }

  const filtered = contactos?.filter((c) => c.estadoRelacion === activeTab) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Contactos"
        description="Gestiona prospectos, clientes activos e inactivos."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nuevo contacto
          </Button>
        }
      />

      {/* Fila de KPIs de la cartera (oculta en error de carga) */}
      {!isError && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total de contactos"
            value={String(kpis.total)}
            icon={Users}
            loading={isLoading}
          />
          <StatCard
            label="Activos"
            value={String(kpis.activos)}
            hint="Con estadoRelación ACTIVO"
            icon={UserCheck}
            loading={isLoading}
          />
          <StatCard
            label="Prospectos"
            value={String(kpis.prospectos)}
            hint="Con estadoRelación PROSPECTO"
            icon={TrendingUp}
            loading={isLoading}
          />
        </div>
      )}

      {/* Loading: esqueleto de tabla en vez de texto plano */}
      {isLoading && (
        <div className="rounded-md border">
          <TableSkeleton columns={7} rows={6} />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="py-12 text-center space-y-3">
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Barra de búsqueda */}
            <div className="relative max-w-sm w-full sm:w-auto">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Buscar por nombre, correo o cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                aria-label="Buscar contactos"
              />
            </div>
          </div>

          {TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              <div className="rounded-md border">
                <ContactosTable
                  contactos={tab.value === activeTab ? filtered : []}
                  searchTerm={searchTerm}
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
