import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { CheckSquare, Contact2, Handshake, ListTodo, Wallet } from 'lucide-react';
import type { Contacto, Empresa, Tarea, Trato } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PipelineKpiCard } from '@/components/shared/PipelineKpiCard';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useContactos } from '@/features/contactos/hooks/useContactos';
import { useTareas } from '@/features/tareas/hooks/useTareas';
import { useTratos } from '@/features/tratos/hooks/useTratos';
import {
  estadoRelacionBadgeClass,
  estadoRelacionLabels,
} from '@/features/contactos/lib/estadoRelacion';
import { tipoContratoBadgeClass, tipoContratoLabels } from '@/features/tratos/lib/tipoContrato';
import { prioridadBadgeClass, prioridadLabels } from '@/features/tareas/lib/tareaBadges';
import { usePermissions } from '@/features/permissions/context';
import { SensitiveField } from '@/features/permissions/components/PermissionState';
import {
  getContactosByEmpresa,
  getCustomer360Kpis,
  getTareasByTratos,
  getTratosByEmpresa,
} from '../lib/customer360';

const PREVIEW_LIMIT = 5;

function LoadingBlock() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

function ContactoRow({ contacto }: { contacto: Contacto }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <Link
          to={`/contactos/${contacto.id}`}
          className="truncate text-sm font-medium text-primary underline-offset-4 hover:underline focus:underline focus:outline-none"
        >
          {contacto.nombre}
        </Link>
        <SensitiveField resource="CONTACTO" group="CONTACTO_PRIVADO">
          <p className="truncate text-xs text-muted-foreground">
            {contacto.correo ?? contacto.telefono ?? 'Sin contacto directo'}
          </p>
        </SensitiveField>
      </div>
      <Badge
        variant="outline"
        className={cn('shrink-0 rounded-full', estadoRelacionBadgeClass[contacto.estadoRelacion])}
      >
        {estadoRelacionLabels[contacto.estadoRelacion]}
      </Badge>
    </li>
  );
}

function TratoRow({ trato }: { trato: Trato }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <Link
          to={`/tratos/${trato.id}`}
          className="block truncate text-sm font-medium text-primary underline-offset-4 hover:underline focus:underline focus:outline-none"
        >
          {trato.nombre}
        </Link>
        <SensitiveField
          resource="TRATO"
          group="FINANCIERO"
          fallback={<span className="block text-xs text-muted-foreground">Finanzas ocultas</span>}
        >
          <p className="truncate text-xs text-muted-foreground">
            {formatCurrency(trato.valorEstimado)} · cierre {formatDate(trato.fechaCierreEsperada)}
          </p>
        </SensitiveField>
      </div>
      <Badge
        variant="outline"
        className={cn('shrink-0 rounded-full', tipoContratoBadgeClass[trato.tipoContrato])}
      >
        {tipoContratoLabels[trato.tipoContrato]}
      </Badge>
    </li>
  );
}

function TareaRow({ tarea }: { tarea: Tarea }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <Link
          to={`/tareas/${tarea.id}`}
          className="truncate text-sm font-medium text-primary underline-offset-4 hover:underline focus:underline focus:outline-none"
        >
          {tarea.titulo}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          vence {formatDate(tarea.fechaLimite)}
        </p>
      </div>
      <Badge
        variant="outline"
        className={cn('shrink-0 rounded-full', prioridadBadgeClass[tarea.prioridad])}
      >
        {prioridadLabels[tarea.prioridad]}
      </Badge>
    </li>
  );
}

export function Empresa360Tab({ empresa }: { empresa: Empresa }) {
  const permissions = usePermissions();
  const canReadFinancial = permissions.canReadGroup('TRATO', 'FINANCIERO');
  const contactosQuery = useContactos();
  const tratosQuery = useTratos();
  const tareasQuery = useTareas();

  const isLoading = contactosQuery.isLoading || tratosQuery.isLoading || tareasQuery.isLoading;
  const hasError = contactosQuery.isError || tratosQuery.isError || tareasQuery.isError;
  const contactos = getContactosByEmpresa(empresa.id, contactosQuery.data ?? []);
  const tratos = getTratosByEmpresa(contactos, tratosQuery.data ?? []);
  const tareas = getTareasByTratos(tratos, tareasQuery.data ?? []);
  const kpis = getCustomer360Kpis(tratos, tareas, contactos);

  return (
    <div className="space-y-4">
      {hasError && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          Algunos datos relacionados no pudieron cargarse. Se muestra la información disponible.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PipelineKpiCard
          label="Contactos"
          value={String(kpis.contactos ?? 0)}
          icon={Contact2}
          loading={isLoading}
        />
        <PipelineKpiCard
          label="Tratos"
          value={String(kpis.tratos)}
          hint={`${kpis.tratosAbiertos} abiertos`}
          icon={Handshake}
          loading={isLoading}
        />
        <PipelineKpiCard
          label="Pipeline abierto"
          value={canReadFinancial ? formatCurrency(kpis.pipelineAbierto) : 'Dato no disponible'}
          icon={Wallet}
          loading={isLoading}
        />
        <PipelineKpiCard
          label="Tareas pendientes"
          value={String(kpis.tareasPendientes)}
          icon={ListTodo}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-lg shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Contact2 className="h-4 w-4 text-primary" aria-hidden="true" />
              Contactos relacionados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingBlock />
            ) : contactos.length === 0 ? (
              <EmptyText>Esta empresa no tiene contactos.</EmptyText>
            ) : (
              <ul className="divide-y">
                {contactos.slice(0, PREVIEW_LIMIT).map((contacto) => (
                  <ContactoRow key={contacto.id} contacto={contacto} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Handshake className="h-4 w-4 text-primary" aria-hidden="true" />
              Tratos relacionados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingBlock />
            ) : tratos.length === 0 ? (
              <EmptyText>No hay tratos relacionados.</EmptyText>
            ) : (
              <ul className="divide-y">
                {tratos.slice(0, PREVIEW_LIMIT).map((trato) => (
                  <TratoRow key={trato.id} trato={trato} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <CheckSquare className="h-4 w-4 text-primary" aria-hidden="true" />
              Tareas relacionadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingBlock />
            ) : tareas.length === 0 ? (
              <EmptyText>No hay tareas relacionadas.</EmptyText>
            ) : (
              <ul className="divide-y">
                {tareas.slice(0, PREVIEW_LIMIT).map((tarea) => (
                  <TareaRow key={tarea.id} tarea={tarea} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
