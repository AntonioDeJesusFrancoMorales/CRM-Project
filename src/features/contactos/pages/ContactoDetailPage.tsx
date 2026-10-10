import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Handshake, Pencil, Trash2 } from 'lucide-react';
import { isHttpError } from '@/api/http-error';
import type { Contacto } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useEmpresas } from '@/features/empresas/hooks/useEmpresas';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { tipoContratoBadgeClass, tipoContratoLabels } from '@/features/tratos/lib/tipoContrato';
import { useTratos } from '@/features/tratos/hooks/useTratos';
import { useContacto } from '../hooks/useContacto';
import { useContactos } from '../hooks/useContactos';
import { useCambiarEstadoContacto } from '../hooks/useCambiarEstadoContacto';
import { ContactoDeleteDialog } from '../components/ContactoDeleteDialog';
import { ContactoFormDialog } from '../components/ContactoFormDialog';
import { Contacto360Tab } from '@/features/customer-360/components/Contacto360Tab';
import { EstadoRelacionSelect } from '../components/EstadoRelacionSelect';
import { estadoRelacionBadgeClass, estadoRelacionLabels } from '../lib/estadoRelacion';
import { usePermissions } from '@/features/permissions/context';
import { SensitiveField } from '@/features/permissions/components/PermissionState';

const NOT_FOUND_REDIRECT_DELAY = 1500;

function InfoField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? '—'}</p>
    </div>
  );
}

function getInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]!}${parts[parts.length - 1]![0]!}`.toUpperCase();
}

export function ContactoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contacto, isLoading, error } = useContacto(id);
  const { data: tratos, isFetching: tratosIsFetching } = useTratos();
  const { data: todosLosContactos } = useContactos();
  const { data: empresas = [] } = useEmpresas();
  const { data: usuarios = [] } = useUsuarios();
  const permissions = usePermissions();
  const canEdit = permissions.allows('CONTACTO', 'ACTUALIZAR');
  const canDelete = permissions.allows('CONTACTO', 'ELIMINAR');
  const cambiarEstadoMutation = useCambiarEstadoContacto();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contacto | null>(null);
  const is404 = isHttpError(error) && error.status === 404;

  useEffect(() => {
    if (!is404) return;
    toast.message('Contacto no encontrado');
    const timeoutId = window.setTimeout(() => {
      navigate('/contactos', { replace: true });
    }, NOT_FOUND_REDIRECT_DELAY);
    return () => window.clearTimeout(timeoutId);
  }, [is404, navigate]);

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Cargando contacto">
        <div className="flex items-start gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-5 w-40 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-9 w-56 rounded-md" />
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    );
  }

  if (is404) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Este contacto no existe. Volviendo al listado...
      </p>
    );
  }

  if (error || !contacto || !id) {
    return (
      <Card>
        <CardContent className="space-y-4 py-12 text-center">
          <p className="text-sm text-destructive">No fue posible cargar el contacto.</p>
          <Button variant="outline" onClick={() => navigate('/contactos')}>
            Volver al listado
          </Button>
        </CardContent>
      </Card>
    );
  }

  const empresaNombre =
    empresas.find((empresa) => empresa.id === contacto.empresaId)?.nombre ?? '—';
  const responsableNombre =
    usuarios.find((usuario) => usuario.id === contacto.responsableId)?.nombre ?? '—';
  const tratosDelContacto = tratos?.filter((trato) => trato.contactoId === id) ?? [];
  const contactoId = contacto.id;

  // The current API no longer exposes a typed deal state, so the server remains
  // the authority for whether a contact can transition to INACTIVO.
  const tieneTratosActivos = false;

  function handleEstadoChange(nuevoEstado: string) {
    cambiarEstadoMutation.mutate({
      id: contactoId,
      nuevoEstado: nuevoEstado as Contacto['estadoRelacion'],
    });
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-[1400px]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/contactos')}
          className="mb-4 -ml-2 text-muted-foreground"
        >
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          Volver a contactos
        </Button>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {getInitials(contacto.nombre)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{contacto.nombre}</h1>
                <Badge
                  variant="outline"
                  className={cn(estadoRelacionBadgeClass[contacto.estadoRelacion])}
                >
                  {estadoRelacionLabels[contacto.estadoRelacion]}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {contacto.cargo ?? 'Contacto comercial'} · {empresaNombre}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
             {canEdit && (
               <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                 <Pencil data-icon="inline-start" aria-hidden="true" />
                 Editar
               </Button>
             )}
             {canDelete && (
               <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(contacto)}>
                 <Trash2 data-icon="inline-start" aria-hidden="true" />
                 Eliminar
               </Button>
             )}
          </div>
        </header>
      </div>

      <Tabs defaultValue="resumen" className="mx-auto w-full max-w-[1400px] gap-4">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger
            value="resumen"
            className="flex-none rounded-none border-b-2 border-transparent px-3 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Resumen 360
          </TabsTrigger>
          <TabsTrigger
            value="info"
            className="flex-none rounded-none border-b-2 border-transparent px-3 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Info
          </TabsTrigger>
          <TabsTrigger
            value="tratos"
            className="flex-none rounded-none border-b-2 border-transparent px-3 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Tratos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-0">
          <Contacto360Tab contacto={contacto} />
        </TabsContent>

        <TabsContent value="info" className="mt-0">
          <Card>
            <CardContent className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <InfoField label="Nombre" value={contacto.nombre} />
               <InfoField
                 label="Correo"
                 value={
                   <SensitiveField resource="CONTACTO" group="CONTACTO_PRIVADO">
                     {contacto.correo ?? '—'}
                   </SensitiveField>
                 }
               />
               <InfoField
                 label="Teléfono"
                 value={
                   <SensitiveField resource="CONTACTO" group="CONTACTO_PRIVADO">
                     {contacto.telefono ?? '—'}
                   </SensitiveField>
                 }
               />
              <InfoField label="Cargo" value={contacto.cargo} />
              <InfoField label="Empresa" value={empresaNombre} />
              <InfoField label="Responsable" value={responsableNombre} />
              <InfoField label="Cómo nos conoció" value={contacto.comoNosConocio} />
              <InfoField label="Creado" value={formatDate(contacto.creadoEn)} />
              <InfoField label="Actualizado" value={formatDate(contacto.actualizadoEn)} />

              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Estado de relación
                </p>
                <div className="max-w-xs">
                  <EstadoRelacionSelect
                    actual={contacto.estadoRelacion}
                    tieneTratosActivos={tieneTratosActivos}
                    value={contacto.estadoRelacion}
                    onChange={handleEstadoChange}
                     disabled={cambiarEstadoMutation.isPending || !canEdit}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tratos" className="mt-0">
          <Card>
            <CardContent className="p-5">
              {tratosDelContacto.length === 0 ? (
                <div className="py-8 text-center">
                  <Handshake className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  <p className="mt-3 font-medium">No hay tratos relacionados</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Los tratos asociados a este contacto aparecerán aquí.
                  </p>
                </div>
              ) : (
                <ul className="divide-y">
                  {tratosDelContacto.map((trato) => (
                    <li key={trato.id} className="flex items-center justify-between gap-3 py-3">
                      <button
                        type="button"
                        onClick={() => void navigate(`/tratos/${trato.id}`)}
                        className="text-left text-sm font-medium text-primary underline-offset-4 hover:underline focus:underline focus:outline-none"
                      >
                        {trato.nombre}
                      </button>
                      <Badge
                        variant="outline"
                        className={cn('shrink-0', tipoContratoBadgeClass[trato.tipoContrato])}
                      >
                        {tipoContratoLabels[trato.tipoContrato]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {canEdit && (
        <ContactoFormDialog
          mode="edit"
          contacto={contacto}
          open={editOpen}
          onOpenChange={setEditOpen}
          existingContactos={todosLosContactos}
        />
      )}

      {canDelete && (
        <ContactoDeleteDialog
          contacto={deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onSuccess={() => navigate('/contactos', { replace: true })}
          tratos={tratos}
          tratosIsFetching={tratosIsFetching}
        />
      )}
    </div>
  );
}
