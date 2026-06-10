// FichaEtiquetasPanel — asignación de etiquetas desde el detalle de un trato/tarea.
// Las etiquetas viven por FICHA (card del kanban), no por trato/tarea. En la práctica
// hay una sola ficha por entidad, así que resolvemos esa ficha y editamos sus etiquetaIds.
// Si la entidad no está en ningún tablero (sin ficha), el panel queda deshabilitado con hint.

import { useEffect, useMemo, useState } from 'react';
import { Check, Tags } from 'lucide-react';
import type { TipoEtiqueta } from '@/api/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFichas } from '@/features/kanban/hooks/useFichas';
import { useUpdateFicha } from '@/features/kanban/hooks/useUpdateFicha';
import type { TipoFicha } from '@/features/kanban/schemas/ficha.schema';
import { useEtiquetas } from '../hooks/useEtiquetas';

interface FichaEtiquetasPanelProps {
  /** TRATO o TAREA — define el tipo de etiquetas elegibles y cómo se resuelve la ficha. */
  tipoFicha: TipoFicha;
  /** Id del trato o de la tarea (según tipoFicha). */
  entidadId: string;
}

export function FichaEtiquetasPanel({ tipoFicha, entidadId }: FichaEtiquetasPanelProps) {
  const tipo = tipoFicha as TipoEtiqueta; // TipoFicha y TipoEtiqueta comparten valores TRATO|TAREA
  const { data: fichas = [], isPending: loadingFichas } = useFichas();
  const { data: catalogo = [] } = useEtiquetas(tipo);
  const updateFicha = useUpdateFicha();

  // Resolución de la (única) ficha de esta entidad. Defensivo: tomamos la primera si hubiera varias.
  const ficha = useMemo(
    () =>
      fichas.find((f) =>
        tipoFicha === 'TRATO' ? f.tratoId === entidadId : f.tareaId === entidadId,
      ),
    [fichas, tipoFicha, entidadId],
  );

  const etiquetaById = useMemo(() => new Map(catalogo.map((e) => [e.id, e])), [catalogo]);
  const asignadas = useMemo(
    () => (ficha?.etiquetas ?? []).map((ref) => etiquetaById.get(ref.id)).filter(Boolean),
    [ficha, etiquetaById],
  );
  // (ficha?.etiquetas ya está normalizado arriba con ?? [])

  const [editOpen, setEditOpen] = useState(false);
  const [seleccion, setSeleccion] = useState<string[]>([]);

  // Al abrir el editor, sembramos la selección con las etiquetas actuales de la ficha.
  useEffect(() => {
    if (editOpen && ficha) {
      setSeleccion((ficha.etiquetas ?? []).map((ref) => ref.id));
    }
  }, [editOpen, ficha]);

  function toggle(id: string) {
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleGuardar() {
    if (!ficha) return;
    updateFicha.mutate(
      {
        id: ficha.id,
        // Reenvío del estado completo + etiquetaIds (el back hace reemplazo total).
        data: {
          columnaId: ficha.columnaId,
          tipoFicha: ficha.tipoFicha,
          tratoId: ficha.tratoId,
          tareaId: ficha.tareaId,
          etiquetaIds: seleccion,
        },
      },
      { onSuccess: () => setEditOpen(false) },
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Tags className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Etiquetas
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            disabled={!ficha || loadingFichas}
          >
            Gestionar
          </Button>
        </div>

        {/* Sin ficha: la entidad no está en ningún tablero → no hay dónde guardar tags */}
        {!loadingFichas && !ficha && (
          <p className="text-sm text-muted-foreground">
            Este {tipoFicha === 'TRATO' ? 'trato' : 'tarea'} no está en ningún tablero. Agregalo a un
            tablero para poder etiquetarlo.
          </p>
        )}

        {ficha && asignadas.length === 0 && (
          <p className="text-sm text-muted-foreground">Sin etiquetas asignadas.</p>
        )}

        {ficha && asignadas.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Etiquetas asignadas">
            {asignadas.map((e) => (
              <li
                key={e!.id}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
                style={{ borderColor: e!.color, backgroundColor: e!.color + '1A', color: e!.color }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e!.color }} aria-hidden="true" />
                {e!.nombre}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {/* Editor: lista del catálogo del tipo, toggle por click */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar etiquetas</DialogTitle>
            <DialogDescription>
              Elegí las etiquetas de {tipoFicha === 'TRATO' ? 'trato' : 'tarea'} para esta ficha.
            </DialogDescription>
          </DialogHeader>

          {catalogo.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay etiquetas de este tipo. Creá una en Configuración → Etiquetas.
            </p>
          ) : (
            <ul className="space-y-1">
              {catalogo.map((e) => {
                const checked = seleccion.includes(e.id);
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => toggle(e.id)}
                      aria-pressed={checked}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                        checked ? 'border-primary bg-primary/5' : 'hover:bg-muted',
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: e.color }} aria-hidden="true" />
                        {e.nombre}
                      </span>
                      {checked && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={updateFicha.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={updateFicha.isPending}>
              {updateFicha.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
