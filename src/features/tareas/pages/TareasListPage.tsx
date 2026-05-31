// TareasListPage — homologa TratosListPage.
// 6 filtros aplicados client-side sobre el array completo (W1 fix, ADR-048).
// Botón "Nueva tarea" → TareaCreateDialog sin tratoIdFijo (Select de trato editable y requerido).
// Tabs Lista/Kanban: los 6 filtros + tabla viven dentro del TabsContent "lista".
// useTabSync preserva ?responsable_id= (y otros params) al cambiar de tab.

import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabSync } from '@/lib/useTabSync';
import { useTareas } from '../hooks/useTareas';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { useTratos } from '@/features/tratos/hooks/useTratos';
import { getTareaEstado } from '../hooks/useTareaEstado';
import { TareasTable } from '../components/TareasTable';
import { TareaCreateDialog } from '../components/TareaCreateDialog';
import { PRIORIDAD_OPTIONS, TIPO_TAREA_OPTIONS } from '../schemas/tarea.schema';
import { KanbanTabContent } from '@/features/kanban/components/KanbanTabContent';
import type { EstadoTareaLocal, PrioridadTarea, TipoTarea } from '@/api/types';

export function TareasListPage() {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [estado, setEstado] = useState<EstadoTareaLocal | undefined>(undefined);
  const [prioridad, setPrioridad] = useState<PrioridadTarea | undefined>(undefined);
  const [responsableId, setResponsableId] = useState<string | undefined>(
    searchParams.get('responsable_id') ?? undefined,
  );
  const [vencimiento, setVencimiento] = useState<'todas' | 'vencidas' | 'proximas' | undefined>(undefined);
  const [tratoId, setTratoId] = useState<string | undefined>(undefined);
  const [tipo, setTipo] = useState<TipoTarea | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);

  // Sincroniza el tab activo con ?tab= en la URL. Preserva otros params (?responsable_id=, etc.).
  // Kanban es el tab por defecto — URL limpia cuando activo = "kanban"; ?tab=lista cuando activo = "lista".
  const [tab, setTab] = useTabSync(['lista', 'kanban'], 'kanban');

  const { data: todasLasTareas, isLoading, isError, refetch } = useTareas();
  const { data: usuarios = [] } = useUsuarios();
  const { data: tratos = [] } = useTratos();

  const usuariosById = Object.fromEntries(usuarios.map((u) => [u.id, u.nombre]));
  const tratosById = Object.fromEntries(tratos.map((t) => [t.id, t.nombre]));

  // Filtros client-side sobre el array completo
  const tareas = useMemo(() => {
    let result = todasLasTareas ?? [];

    if (estado) {
      result = result.filter((t) => getTareaEstado(t.id) === estado);
    }
    if (prioridad) {
      result = result.filter((t) => t.prioridad === prioridad);
    }
    if (responsableId) {
      result = result.filter((t) => t.responsableId === responsableId);
    }
    if (tratoId) {
      result = result.filter((t) => t.tratoId === tratoId);
    }
    if (tipo) {
      result = result.filter((t) => t.tipo === tipo);
    }
    if (vencimiento && vencimiento !== 'todas') {
      const ahora = new Date();
      const en7Dias = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (vencimiento === 'vencidas') {
        result = result.filter((t) => t.fechaLimite && new Date(t.fechaLimite) < ahora);
      } else if (vencimiento === 'proximas') {
        result = result.filter((t) => {
          if (!t.fechaLimite) return false;
          const fecha = new Date(t.fechaLimite);
          return fecha >= ahora && fecha <= en7Dias;
        });
      }
    }

    return result;
  }, [todasLasTareas, estado, prioridad, responsableId, tratoId, tipo, vencimiento]);

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

      {/* Tabs Lista / Kanban */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>

        {/* Tab Lista: 6 filtros + tabla */}
        <TabsContent value="lista" className="mt-4 space-y-4">
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

            {/* Filtro prioridad — usa enums del back */}
            <Select
              value={prioridad ?? 'todas'}
              onValueChange={setOrUnset<PrioridadTarea>(setPrioridad, 'todas')}
            >
              <SelectTrigger className="w-40" aria-label="Prioridad">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las prioridades</SelectItem>
                {PRIORIDAD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro tipo — usa enums del back */}
            <Select
              value={tipo ?? 'todos'}
              onValueChange={setOrUnset<TipoTarea>(setTipo, 'todos')}
            >
              <SelectTrigger className="w-40" aria-label="Tipo">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {TIPO_TAREA_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
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
        </TabsContent>

        {/* Tab Kanban: KanbanTabContent tipo TAREAS */}
        <TabsContent value="kanban" className="mt-4">
          <KanbanTabContent tipo="TAREAS" />
        </TabsContent>
      </Tabs>

      {/* Dialog crear tarea — sin tratoIdFijo (Select editable y requerido) */}
      <TareaCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
