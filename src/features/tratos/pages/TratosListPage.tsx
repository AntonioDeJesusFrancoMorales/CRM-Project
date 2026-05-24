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
import { useTratos, type UseTratosFilters } from '../hooks/useTratos';
import { useClientes } from '@/features/clientes/hooks/useClientes';
import { useProspectos } from '@/features/prospectos/hooks/useProspectos';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { TratosTable } from '../components/TratosTable';
import { TratoCreateDialog } from '../components/TratoCreateDialog';
import type { EstadoTrato } from '@/api/types';

export function TratosListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [estado, setEstado] = useState<EstadoTrato | undefined>(undefined);
  const [clienteId, setClienteId] = useState<string | undefined>(undefined);
  const [prospectoId, setProspectoId] = useState<string | undefined>(undefined);
  const [responsableId, setResponsableId] = useState<string | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);

  const filters: UseTratosFilters = {};
  if (estado) filters.estado = estado;
  if (clienteId) filters.cliente_id = clienteId;
  if (prospectoId) filters.prospecto_id = prospectoId;
  if (responsableId) filters.responsable_id = responsableId;

  const { data: tratos, isLoading, isError, refetch } = useTratos(filters);
  const { data: allClientes = [] } = useClientes();
  const { data: allProspectos = [] } = useProspectos();
  const { data: usuarios = [] } = useUsuarios();

  // Lote F (post-smoke fix #2): los Selects de cliente/prospecto solo muestran
  // entidades que tienen al menos 1 trato (evita opciones que devuelven resultado vacío).
  // Si el filtro actual está activo, lo preservamos en el Select aunque no aparezca
  // en la lista filtrada (para que el chip de filtro siga viendo su label).
  const tratosUnfiltered = tratos ?? [];
  const clienteIdsConTratos = new Set(
    tratosUnfiltered.map((t) => t.cliente_id).filter((id): id is string => id !== null),
  );
  const prospectoIdsConTratos = new Set(
    tratosUnfiltered.map((t) => t.prospecto_id).filter((id): id is string => id !== null),
  );
  const clientes = allClientes.filter(
    (c) => clienteIdsConTratos.has(c.id) || c.id === clienteId,
  );
  const prospectos = allProspectos.filter(
    (p) => prospectoIdsConTratos.has(p.id) || p.id === prospectoId,
  );

  function handleEstadoChange(value: string) {
    if (value === 'todos') setEstado(undefined);
    else if (value === 'abierto' || value === 'ganado' || value === 'perdido') setEstado(value);
  }

  function setOrUnset(setter: (v: string | undefined) => void, sentinel: string) {
    return (value: string) => setter(value === sentinel ? undefined : value);
  }

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

      {/* Top-bar de filtros */}
      <div className="flex flex-wrap items-center gap-3">
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

        <Select value={estado ?? 'todos'} onValueChange={handleEstadoChange}>
          <SelectTrigger className="w-40" aria-label="Estado">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="abierto">Abierto</SelectItem>
            <SelectItem value="ganado">Ganado</SelectItem>
            <SelectItem value="perdido">Perdido</SelectItem>
          </SelectContent>
        </Select>

        <Select value={clienteId ?? 'todos'} onValueChange={setOrUnset(setClienteId, 'todos')}>
          <SelectTrigger className="w-48" aria-label="Cliente">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los clientes</SelectItem>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nombre_contacto}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={prospectoId ?? 'todos'} onValueChange={setOrUnset(setProspectoId, 'todos')}>
          <SelectTrigger className="w-48" aria-label="Prospecto">
            <SelectValue placeholder="Prospecto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los prospectos</SelectItem>
            {prospectos.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nombre_contacto}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={responsableId ?? 'todos'} onValueChange={setOrUnset(setResponsableId, 'todos')}>
          <SelectTrigger className="w-48" aria-label="Responsable">
            <SelectValue placeholder="Responsable" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los responsables</SelectItem>
            {usuarios
              .filter((u) => u.activo)
              .map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nombre}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
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
            clientes={clientes}
            prospectos={prospectos}
            searchTerm={searchTerm}
          />
        </div>
      )}

      {/* Dialog crear trato */}
      <TratoCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
