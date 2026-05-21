import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Empresa } from '@/api/types';
import { isHttpError } from '@/api/http-error';
import { useEmpresa } from '../hooks/useEmpresa';
import { EmpresaInfoTab } from '../components/EmpresaInfoTab';
import { EmpresaProspectosTab } from '../components/EmpresaProspectosTab';
import { EmpresaClientesTab } from '../components/EmpresaClientesTab';
import { EmpresaFormDialog } from '../components/EmpresaFormDialog';
import { EmpresaDeleteDialog } from '../components/EmpresaDeleteDialog';

const NOT_FOUND_REDIRECT_DELAY = 1500;

export function EmpresaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: empresa, isLoading, error } = useEmpresa(id);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Empresa | null>(null);

  const is404 = isHttpError(error) && error.status === 404;

  useEffect(() => {
    if (!is404) return;
    toast.message('Empresa no encontrada');
    const timeoutId = window.setTimeout(() => {
      navigate('/empresas', { replace: true });
    }, NOT_FOUND_REDIRECT_DELAY);
    return () => window.clearTimeout(timeoutId);
  }, [is404, navigate]);

  if (isLoading) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Cargando empresa...
      </p>
    );
  }

  if (is404) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Esta empresa no existe. Volviendo al listado...
      </p>
    );
  }

  if (error || !empresa || !id) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-destructive">
          No fue posible cargar la empresa.
        </p>
        <Button variant="outline" onClick={() => navigate('/empresas')}>
          Volver al listado
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/empresas')}
            aria-label="Volver al listado"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{empresa.nombre}</h1>
            <p className="text-sm text-muted-foreground">
              {empresa.sector ?? 'Sin sector definido'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
            Editar
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteTarget(empresa)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Eliminar
          </Button>
        </div>
      </header>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="prospectos">Prospectos</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="mt-4">
          <EmpresaInfoTab empresa={empresa} />
        </TabsContent>
        <TabsContent value="prospectos" className="mt-4">
          <EmpresaProspectosTab empresaId={empresa.id} />
        </TabsContent>
        <TabsContent value="clientes" className="mt-4">
          <EmpresaClientesTab empresaId={empresa.id} />
        </TabsContent>
      </Tabs>

      <EmpresaFormDialog
        mode="edit"
        empresa={empresa}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <EmpresaDeleteDialog
        empresa={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onSuccess={() => navigate('/empresas', { replace: true })}
      />
    </div>
  );
}
