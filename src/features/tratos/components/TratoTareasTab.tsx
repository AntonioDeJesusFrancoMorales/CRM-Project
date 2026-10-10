// TratoTareasTab — tab de tareas en el detalle de un Trato.
// Lista las tareas del trato mediante useTareas() (get-all) + filtro client-side por tratoId.
// Botón "Crear tarea" abre TareaCreateDialog con tratoIdFijo para bloquear el Select de trato.
// ADR-051: montado como TabsContent — lazy load por montaje.

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTareas } from '@/features/tareas/hooks/useTareas';
import { TareasTable } from '@/features/tareas/components/TareasTable';
import { TareaCreateDialog } from '@/features/tareas/components/TareaCreateDialog';
import { useTratos } from '@/features/tratos/hooks/useTratos';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { usePermissions } from '@/features/permissions/context';

interface TratoTareasTabProps {
  tratoId: string;
}

export function TratoTareasTab({ tratoId }: TratoTareasTabProps) {
  const permissions = usePermissions();
  const canCreateTask = permissions.allows('TAREA', 'CREAR');
  const canEditTask = permissions.allows('TAREA', 'ACTUALIZAR');
  const canDeleteTask = permissions.allows('TAREA', 'ELIMINAR');
  const { data: todasLasTareas = [], isLoading, isError } = useTareas();
  const { data: tratos = [] } = useTratos();
  const { data: usuarios = [] } = useUsuarios();
  const [createOpen, setCreateOpen] = useState(false);

  // Filtro client-side por tratoId
  const tareas = useMemo(
    () => todasLasTareas.filter((t) => t.tratoId === tratoId),
    [todasLasTareas, tratoId],
  );

  const tratosById = Object.fromEntries(tratos.map((t) => [t.id, t.nombre]));
  const usuariosById = Object.fromEntries(usuarios.map((u) => [u.id, u.nombre]));

  return (
    <div className="space-y-4">
      {/* Header con botón crear (siempre visible) */}
      <div className="flex justify-end">
        {canCreateTask && (
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Crear tarea
          </Button>
        )}
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="space-y-2" aria-busy="true" aria-label="Cargando tareas">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : isError ? (
        <p className="py-8 text-center text-sm text-destructive">
          Error al cargar las tareas. Intenta de nuevo.
        </p>
      ) : !tareas.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Sin tareas registradas</p>
          </CardContent>
        </Card>
      ) : (
        <TareasTable
          tareas={tareas}
          tratosById={tratosById}
          usuariosById={usuariosById}
          canEdit={canEditTask}
          canDelete={canDeleteTask}
        />
      )}

      {/* Dialog crear tarea — trato fijo (Select disabled) */}
      {canCreateTask && (
        <TareaCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          tratoIdFijo={tratoId}
        />
      )}
    </div>
  );
}
