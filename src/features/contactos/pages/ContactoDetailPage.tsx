import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Contacto } from '@/api/types';
import { useContacto } from '../hooks/useContacto';
import { useTratos } from '@/features/tratos/hooks/useTratos';
import { ContactoFormDialog } from '../components/ContactoFormDialog';
import { ContactoDeleteDialog } from '../components/ContactoDeleteDialog';
import { EstadoRelacionSelect } from '../components/EstadoRelacionSelect';
import { useUpdateContacto } from '../hooks/useUpdateContacto';

const NOT_FOUND_REDIRECT_DELAY = 1500;

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  PROSPECTO: 'outline',
  ACTIVO: 'default',
  INACTIVO: 'secondary',
};

const ESTADO_LABELS: Record<string, string> = {
  PROSPECTO: 'Prospecto',
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
};

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm">{value ?? '—'}</p>
    </div>
  );
}

export function ContactoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contacto, isLoading, error } = useContacto(id);
  const { data: tratos } = useTratos();
  const updateMutation = useUpdateContacto();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contacto | null>(null);

  const notFound = !isLoading && !contacto && !!error;

  useEffect(() => {
    if (!notFound) return;
    toast.message('Contacto no encontrado');
    const timeoutId = window.setTimeout(() => {
      navigate('/contactos', { replace: true });
    }, NOT_FOUND_REDIRECT_DELAY);
    return () => window.clearTimeout(timeoutId);
  }, [notFound, navigate]);

  if (isLoading) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Cargando contacto...
      </p>
    );
  }

  if (notFound) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Este contacto no existe. Volviendo al listado...
      </p>
    );
  }

  if (error || !contacto || !id) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-destructive">
          No fue posible cargar el contacto.
        </p>
        <Button variant="outline" onClick={() => navigate('/contactos')}>
          Volver al listado
        </Button>
      </div>
    );
  }

  const tratosDelContacto = tratos?.filter((t) => t.contactoId === id) ?? [];

  // El modelo Trato ya no expone `estado` (ciclo de vida diferido al Kanban, Change 4).
  // Hasta entonces, cualquier trato vinculado se considera relación activa para el guard
  // que impide marcar el contacto como INACTIVO.
  const tieneTratosActivos = tratosDelContacto.length > 0;

  function handleEstadoChange(nuevoEstado: string) {
    if (!contacto) return;
    updateMutation.mutate(
      { id: contacto.id, data: { estadoRelacion: nuevoEstado as Contacto['estadoRelacion'] } },
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/contactos')}
            aria-label="Volver al listado"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {contacto.nombre}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={ESTADO_VARIANT[contacto.estadoRelacion]}>
                {ESTADO_LABELS[contacto.estadoRelacion] ?? contacto.estadoRelacion}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
            Editar
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteTarget(contacto)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Eliminar
          </Button>
        </div>
      </header>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="tratos">Tratos</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <div className="rounded-lg border p-4 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoField label="Nombre" value={contacto.nombre} />
              <InfoField label="Correo" value={contacto.correo} />
              <InfoField label="Teléfono" value={contacto.telefono} />
              <InfoField label="Cómo nos conoció" value={contacto.comoNosConocio} />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Estado de relación
              </p>
              <div className="max-w-xs">
                <EstadoRelacionSelect
                  actual={contacto.estadoRelacion}
                  tieneTratosActivos={tieneTratosActivos}
                  value={contacto.estadoRelacion}
                  onChange={handleEstadoChange}
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tratos" className="mt-4">
          <div className="rounded-lg border p-4">
            {tratosDelContacto.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Este contacto no tiene tratos registrados.
              </p>
            ) : (
              <ul className="divide-y">
                {tratosDelContacto.map((trato) => (
                  <li key={trato.id} className="py-3 flex items-center justify-between">
                    <span className="text-sm font-medium">{trato.nombre}</span>
                    <Badge variant="outline">{trato.tipoContrato}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {contacto && (
        <ContactoFormDialog
          mode="edit"
          contacto={contacto}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}

      <ContactoDeleteDialog
        contacto={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onSuccess={() => navigate('/contactos', { replace: true })}
      />
    </div>
  );
}
