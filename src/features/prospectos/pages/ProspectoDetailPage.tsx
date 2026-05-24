import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, ExternalLink, Pencil, Trash2, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Empresa, Prospecto, Usuario } from '@/api/types';
import { isHttpError } from '@/api/http-error';
import { useProspecto } from '../hooks/useProspecto';
import { useClientes } from '@/features/clientes/hooks/useClientes';
import { useEmpresas } from '@/features/empresas/hooks/useEmpresas';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { ProspectoInfoTab } from '../components/ProspectoInfoTab';
import { ProspectoTratosTab } from '../components/ProspectoTratosTab';
import { ProspectoFormDialog } from '../components/ProspectoFormDialog';
import { ProspectoDeleteDialog } from '../components/ProspectoDeleteDialog';
import { ConvertirProspectoDialog } from '../components/ConvertirProspectoDialog';

// Design sección 3: Container — orquesta hooks + estado UI local
// ADR-026: botón Editar siempre visible; isLocked derivado del estado en ProspectoFormDialog
// ADR-027: lazy load del tab Tratos via enabled prop
// REQ-PROS-DETALLE-001..003, REQ-PROS-TRATOS-001..003, REQ-CONV-ACCION-001..002

const NOT_FOUND_REDIRECT_DELAY = 1500;

export function ProspectoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: prospecto, isLoading, error } = useProspecto(id);
  const { data: empresas = [] } = useEmpresas();
  const { data: usuarios = [] } = useUsuarios();
  const { data: clientes = [] } = useClientes();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Prospecto | null>(null);
  const [convertirTarget, setConvertirTarget] = useState<Prospecto | null>(null);
  const [activeTab, setActiveTab] = useState<string>('info');

  const is404 = isHttpError(error) && error.status === 404;
  const isConvertido = prospecto?.estado_posible_cliente === 'convertido';

  // Redirect automático en 404 (patrón de EmpresaDetailPage)
  useEffect(() => {
    if (!is404) return;
    toast.message('Prospecto no encontrado');
    const timeoutId = window.setTimeout(() => {
      navigate('/prospectos', { replace: true });
    }, NOT_FOUND_REDIRECT_DELAY);
    return () => window.clearTimeout(timeoutId);
  }, [is404, navigate]);

  // Resolver empresa y responsable para ProspectoInfoTab
  const empresasById = Object.fromEntries(empresas.map((e: Empresa) => [e.id, e]));
  const usuariosById = Object.fromEntries(usuarios.map((u: Usuario) => [u.id, u]));
  const empresaNombre = prospecto ? empresasById[prospecto.empresa_id]?.nombre : undefined;
  const responsableNombre = prospecto ? usuariosById[prospecto.responsable_id]?.nombre : undefined;

  // Change 6a Lote E: cross-link al cliente resultante si el prospecto está convertido.
  const clienteConvertido =
    isConvertido && prospecto
      ? clientes.find((c) => c.prospecto_origen_id === prospecto.id) ?? null
      : null;

  if (isLoading) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Cargando prospecto...
      </p>
    );
  }

  if (is404) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Este prospecto no existe. Volviendo al listado...
      </p>
    );
  }

  if (error || !prospecto || !id) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-destructive">
          No fue posible cargar el prospecto.
        </p>
        <Button variant="outline" onClick={() => navigate('/prospectos')}>
          Volver al listado
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con nombre, badge y acciones */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/prospectos')}
            aria-label="Volver al listado"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {prospecto.nombre_contacto}
              </h1>
              {/* Badge "Convertido" en header — REQ-PROS-DETALLE-003 */}
              {isConvertido && (
                <Badge className="bg-green-100 text-green-700 border-transparent">
                  Convertido
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {prospecto.cargo_contacto ?? 'Sin cargo'}
            </p>
            {/* Change 6a Lote E: cross-link al cliente resultante */}
            {clienteConvertido && (
              <Link
                to={`/clientes/${clienteConvertido.id}`}
                className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Ver cliente convertido
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Botón "Convertir a cliente" — oculto si ya convertido (REQ-CONV-ACCION-002) */}
          {!isConvertido && (
            <Button
              variant="outline"
              onClick={() => setConvertirTarget(prospecto)}
            >
              <UserCheck className="mr-2 h-4 w-4" aria-hidden="true" />
              Convertir a cliente
            </Button>
          )}

          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
            Editar
          </Button>

          <Button
            variant="outline"
            onClick={() => setDeleteTarget(prospecto)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Eliminar
          </Button>
        </div>
      </header>

      {/* Tabs: Información y Tratos (ADR-027 — lazy load de Tratos) */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="tratos">Tratos</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <ProspectoInfoTab
            prospecto={prospecto}
            empresaNombre={empresaNombre}
            responsableNombre={responsableNombre}
          />
        </TabsContent>

        <TabsContent value="tratos" className="mt-4">
          {/* Change 6a Lote E: mensaje + link al cliente convertido (si aplica) */}
          {clienteConvertido && (
            <div className="mb-4 rounded-md border border-dashed bg-muted/40 p-3 text-sm">
              Estos son los tratos históricos del prospecto.{' '}
              <Link
                to={`/clientes/${clienteConvertido.id}?tab=tratos`}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Ver tratos del cliente
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          )}
          {/* ADR-027: solo habilitar el fetch cuando el tab está activo */}
          <ProspectoTratosTab
            prospectoId={id}
            enabled={activeTab === 'tratos'}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {prospecto && (
        <ProspectoFormDialog
          mode="edit"
          prospecto={prospecto}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}

      <ProspectoDeleteDialog
        prospecto={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onSuccess={() => navigate('/prospectos', { replace: true })}
      />

      <ConvertirProspectoDialog
        prospecto={convertirTarget}
        onOpenChange={(open) => {
          if (!open) setConvertirTarget(null);
        }}
      />
    </div>
  );
}
