import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClientes, type UseClientesFilters } from '../hooks/useClientes';
import { useEmpresas } from '@/features/empresas/hooks/useEmpresas';
import { ClientesTable } from '../components/ClientesTable';
import { ClienteCreateDialog } from '../components/ClienteCreateDialog';

// REQ-01: listado de clientes con filtros
// ADR-031: búsqueda por nombre es client-side; filtros empresa/origen pasan a useClientes (server-side)

export function ClientesListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [empresaId, setEmpresaId] = useState<string | undefined>(undefined);
  const [origen, setOrigen] = useState<UseClientesFilters['origen'] | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);

  const filters: UseClientesFilters = {};
  if (empresaId) filters.empresa_id = empresaId;
  if (origen) filters.origen = origen;

  const { data: clientes, isLoading, isError, refetch } = useClientes(filters);
  const { data: empresas = [] } = useEmpresas();

  function handleEmpresaChange(value: string) {
    setEmpresaId(value === 'todas' ? undefined : value);
  }

  function handleOrigenChange(value: string) {
    if (value === 'todos') {
      setOrigen(undefined);
    } else if (value === 'prospecto' || value === 'manual') {
      setOrigen(value);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los clientes vinculados al CRM.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Nuevo cliente
        </Button>
      </header>

      {/* Top-bar de filtros */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Búsqueda client-side por nombre */}
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
            aria-label="Buscar clientes"
          />
        </div>

        {/* Filtro por empresa (server-side) */}
        <Select value={empresaId ?? 'todas'} onValueChange={handleEmpresaChange}>
          <SelectTrigger className="w-48" aria-label="Empresa">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las empresas</SelectItem>
            {empresas.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro por origen (server-side) */}
        <Select value={origen ?? 'todos'} onValueChange={handleOrigenChange}>
          <SelectTrigger className="w-44" aria-label="Origen">
            <SelectValue placeholder="Origen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los orígenes</SelectItem>
            <SelectItem value="prospecto">Prospecto convertido</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Cargando clientes...
        </p>
      )}

      {/* Error */}
      {isError && (
        <div className="py-12 text-center space-y-3">
          <p className="text-sm text-destructive">
            No fue posible cargar los clientes. Intenta de nuevo.
          </p>
          <Button variant="outline" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Tabla */}
      {!isLoading && !isError && clientes && (
        <div className="rounded-md border">
          <ClientesTable
            clientes={clientes}
            empresas={empresas}
            searchTerm={searchTerm}
          />
        </div>
      )}

      {/* Dialog crear cliente */}
      <ClienteCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
