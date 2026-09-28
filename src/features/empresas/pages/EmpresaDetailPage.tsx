import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Pencil, Trash2 } from 'lucide-react';
import type { Empresa } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { estadoRelacionBadgeClass, estadoRelacionLabels } from '../lib/estadoRelacion';
import { useEmpresa } from '../hooks/useEmpresa';
import { useEmpresas } from '../hooks/useEmpresas';
import { EmpresaInfoTab } from '../components/EmpresaInfoTab';
import { EmpresaContactosTab } from '../components/EmpresaContactosTab';
import { EmpresaFormDialog } from '../components/EmpresaFormDialog';
import { EmpresaDeleteDialog } from '../components/EmpresaDeleteDialog';
import { Empresa360Tab } from '@/features/customer-360/components/Empresa360Tab';

const NOT_FOUND_REDIRECT_DELAY = 1500;

export function EmpresaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: empresa, isLoading, error } = useEmpresa(id);
  const { data: empresas } = useEmpresas();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Empresa | null>(null);

  // useEmpresa resolves a missing id from the get-all response with this domain error.
  // Other errors must remain visible as errors instead of being reported as 404s.
  const notFound =
    !isLoading && !empresa && error instanceof Error && error.message === 'Empresa no encontrada';

  useEffect(() => {
    if (!notFound) return;
    toast.message('Empresa no encontrada');
    const timeoutId = window.setTimeout(() => {
      navigate('/empresas', { replace: true });
    }, NOT_FOUND_REDIRECT_DELAY);
    return () => window.clearTimeout(timeoutId);
  }, [notFound, navigate]);

  if (isLoading) {
    return (
      <div
        className="flex flex-col gap-5 p-4 sm:p-6"
        aria-busy="true"
        aria-label="Cargando empresa"
      >
        <div className="mx-auto w-full max-w-[1400px]">
          <Skeleton className="mb-4 h-7 w-40" />
          <div className="flex items-start gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1400px] space-y-4">
          <Skeleton className="h-9 w-72" />
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-4 sm:p-6">
        <p className="mx-auto max-w-[1400px] py-12 text-center text-sm text-muted-foreground">
          Esta empresa no existe. Volviendo al listado...
        </p>
      </div>
    );
  }

  if (error || !empresa || !id) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="mx-auto w-full max-w-[1400px]">
          <CardContent className="space-y-4 py-12 text-center">
            <p className="text-sm text-destructive">No fue posible cargar la empresa.</p>
            <Button variant="outline" onClick={() => navigate('/empresas')}>
              Volver al listado
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-[1400px]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/empresas')}
          className="mb-4 -ml-2 text-muted-foreground"
        >
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          Volver a empresas
        </Button>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-2xl font-bold tracking-tight [overflow-wrap:anywhere]">
                  {empresa.nombre}
                </h1>
                <Badge
                  variant="outline"
                  className={cn('rounded-full', estadoRelacionBadgeClass[empresa.estadoRelacion])}
                >
                  {estadoRelacionLabels[empresa.estadoRelacion]}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {empresa.sector ?? 'Empresa vinculada al CRM'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil data-icon="inline-start" aria-hidden="true" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(empresa)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 data-icon="inline-start" aria-hidden="true" />
              Eliminar
            </Button>
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
            Información
          </TabsTrigger>
          <TabsTrigger
            value="contactos"
            className="flex-none rounded-none border-b-2 border-transparent px-3 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Contactos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-0">
          <Empresa360Tab empresa={empresa} />
        </TabsContent>
        <TabsContent value="info" className="mt-0">
          <EmpresaInfoTab empresa={empresa} />
        </TabsContent>
        <TabsContent value="contactos" className="mt-0">
          <EmpresaContactosTab empresaId={empresa.id} />
        </TabsContent>
      </Tabs>

      <EmpresaFormDialog
        mode="edit"
        empresa={empresa}
        open={editOpen}
        onOpenChange={setEditOpen}
        existingEmpresas={empresas}
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
