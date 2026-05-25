// TareasListPage — homologa TratosListPage.
// 6 filtros: estado, prioridad, responsable, vencimiento, trato, búsqueda (client-side).
// Botón "Nueva tarea" → TareaCreateDialog sin tratoIdFijo (Select de trato editable y requerido).

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
import { useTareas, type UseTareasFilters } from '../hooks/useTareas';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { useTratos } from '@/features/tratos/hooks/useTratos';
import { TareasTable } from '../components/TareasTable';
import { TareaCreateDialog } from '../components/TareaCreateDialog';
import type { EstadoTarea } from '@/api/types';

export function TareasListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [estado, setEstado] = useState<EstadoTarea | undefined>(undefined);
  const [prioridad, setPrioridad] = useState<1 | 2 | 3 | undefined>(undefined);
  const [responsableId, setResponsableId] = useState<string | undefined>(undefined);
  const [vencimiento, setVencimiento] = useState<'todas' | 'vencidas' | 'proximas' | undefined>(undefined);
  const [tratoId, setTratoId] = useState<string | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);

  const filters: UseTareasFilters = {};
  if (estado) filters.estado = estado;
  if (prioridad) filters.prioridad = prioridad;
  if (responsableId) filters.responsable_id = responsableId;
  if (vencimiento && vencimiento !== 'todas') filters.vencimiento = vencimiento;
  if (tratoId) filters.trato_id = tratoId;

  const { data: tareas, isLoading, isError, refetch } = useTareas(filters);
  const { data: usuarios = [] } = useUsuarios();
  const { data: tratos = [] } = useTratos();

  const usuariosById = Object.fromEntries(usuarios.map((u) => [u.id, u.nombre]));
  const tratosById = Object.fromEntries(tratos.map((t) => [t.id, t.nombre]));

  function setOrUnset<T>(setter: (v: T | undefined) => void, sentinel: string) {
    return (value: string) =>
      setter(value === sentinel ? undefined : (value as unknown as T));
  }

  function handleEstadoChange(value: string) {
    if (value === 'todos') setEstado(undefined);
    else if (value === 'pendiente' || value === 'en_progreso' || value === 'completada') {
      setEstado(value);
    }
  }

  function handlePrioridadChange(value: string) {
    if (value === 'todas') setPrioridad(undefined);
    else setPrioridad(Number(value) as 1 | 2 | 3);
  }

  function handleVencimientoChange(value: string) {
    if (value === 'todas') setVencimiento(undefined);
    else setVencimiento(value as 'vencidas' | 'proximas');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tareas</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las tareas del CRM.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Nueva tarea
        </Button>
      </header>

      {/* Top-bar de filtros */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Búsqueda client-side por título */}
        <div className="relative max-w-sm flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            aria-label="Buscar tareas"
          />
        </div>

        {/* Filtro estado */}
        <Select value={estado ?? 'todos'} onValueChange={handleEstadoChange}>
          <SelectTrigger className="w-40" aria-label="Estado">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_progreso">En progreso</SelectItem>
            <SelectItem value="completada">Completada</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro prioridad */}
        <Select value={prioridad !== undefined ? String(prioridad) : 'todas'} onValueChange={handlePrioridadChange}>
          <SelectTrigger className="w-40" aria-label="Prioridad">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las prioridades</SelectItem>
            <SelectItem value="1">Alta</SelectItem>
            <SelectItem value="2">Media</SelectItem>
            <SelectItem value="3">Baja</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro vencimiento */}
        <Select value={vencimiento ?? 'todas'} onValueChange={handleVencimientoChange}>
          <SelectTrigger className="w-40" aria-label="Vencimiento">
            <SelectValue placeholder="Vencimiento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las fechas</SelectItem>
            <SelectItem value="vencidas">Vencidas</SelectItem>
            <SelectItem value="proximas">Próximas (7 días)</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro responsable */}
        <Select
          value={responsableId ?? 'todos'}
          onValueChange={setOrUnset<string>(setResponsableId, 'todos')}
        >
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

        {/* Filtro trato */}
        <Select
          value={tratoId ?? 'todos'}
          onValueChange={setOrUnset<string>(setTratoId, 'todos')}
        >
          <SelectTrigger className="w-48" aria-label="Trato">
            <SelectValue placeholder="Trato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tratos</SelectItem>
            {tratos.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Cargando tareas...
        </p>
      )}

      {/* Error */}
      {isError && (
        <div className="py-12 text-center space-y-3">
          <p className="text-sm text-destructive">
            No fue posible cargar las tareas. Intenta de nuevo.
          </p>
          <Button variant="outline" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Tabla */}
      {!isLoading && !isError && tareas && (
        <div className="rounded-md border">
          <TareasTable
            tareas={tareas}
            tratosById={tratosById}
            usuariosById={usuariosById}
            searchTerm={searchTerm}
          />
        </div>
      )}

      {/* Dialog crear tarea — sin tratoIdFijo (Select editable y requerido) */}
      <TareaCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
