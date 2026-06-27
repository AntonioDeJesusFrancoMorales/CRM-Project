import { Link } from 'react-router';
import { CheckSquare, Contact2, Handshake, ListTodo, Wallet } from 'lucide-react';
import type { Contacto, Tarea, Trato } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/shared/StatCard';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useContactos } from '@/features/contactos/hooks/useContactos';
import { useTareas } from '@/features/tareas/hooks/useTareas';
import { useTratos } from '@/features/tratos/hooks/useTratos';
import { estadoRelacionBadgeClass, estadoRelacionLabels } from '@/features/contactos/lib/estadoRelacion';
import { tipoContratoBadgeClass, tipoContratoLabels } from '@/features/tratos/lib/tipoContrato';
import { prioridadBadgeClass, prioridadLabels } from '@/features/tareas/lib/tareaBadges';
import {
  getContactosByEmpresa,
  getCustomer360Kpis,
  getTareasByTratos,
  getTratosByEmpresa,
} from '../lib/customer360';
import type { Empresa } from '@/api/types';

const PREVIEW_LIMIT = 5;

function LoadingBlock() {
  return (
    <div className="space-y-2" aria-busy="true">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

function ContactoRow({ contacto }: { contacto: Contacto }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <Link to={`/contactos/${contacto.id}`} className="truncate text-sm font-medium text-primary underline-offset-4 hover:underline focus:underline focus:outline-none">
          {contacto.nombre}
        </Link>
        <p className="text-xs text-muted-foreground">{contacto.correo ?? contacto.telefono ?? 'Sin contacto directo'}</p>
      </div>
      <Badge variant="outline" className={cn('shrink-0', estadoRelacionBadgeClass[contacto.estadoRelacion])}>
        {estadoRelacionLabels[contacto.estadoRelacion]}
      </Badge>
    </li>
  );
}

function TratoRow({ trato }: { trato: Trato }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <Link to={`/tratos/${trato.id}`} className="truncate text-sm font-medium text-primary underline-offset-4 hover:underline focus:underline focus:outline-none">
          {trato.nombre}
        </Link>
        <p className="text-xs text-muted-foreground">{formatCurrency(trato.valorEstimado)} · cierre {formatDate(trato.fechaCierreEsperada)}</p>
      </div>
      <Badge variant="outline" className={cn('shrink-0', tipoContratoBadgeClass[trato.tipoContrato])}>
        {tipoContratoLabels[trato.tipoContrato]}
      </Badge>
    </li>
  );
}

function TareaRow({ tarea }: { tarea: Tarea }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <Link to={`/tareas/${tarea.id}`} className="truncate text-sm font-medium text-primary underline-offset-4 hover:underline focus:underline focus:outline-none">
          {tarea.titulo}
        </Link>
        <p className="text-xs text-muted-foreground">vence {formatDate(tarea.fechaLimite)}</p>
      </div>
      <Badge variant="outline" className={cn('shrink-0', prioridadBadgeClass[tarea.prioridad])}>
        {prioridadLabels[tarea.prioridad]}
      </Badge>
    </li>
  );
}

export function Empresa360Tab({ empresa }: { empresa: Empresa }) {
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
    <div className="space-y-6">
      {hasError && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          Algunos datos relacionados no pudieron cargarse. Se muestra la información disponible.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Contactos" value={String(kpis.contactos ?? 0)} icon={Contact2} loading={isLoading} />
        <StatCard label="Tratos" value={String(kpis.tratos)} hint={`${kpis.tratosAbiertos} abiertos`} icon={Handshake} loading={isLoading} />
        <StatCard label="Pipeline abierto" value={formatCurrency(kpis.pipelineAbierto)} icon={Wallet} loading={isLoading} />
        <StatCard label="Tareas pendientes" value={String(kpis.tareasPendientes)} icon={ListTodo} loading={isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Contact2 className="h-4 w-4" /> Contactos</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <LoadingBlock /> : contactos.length === 0 ? <EmptyText>Esta empresa no tiene contactos.</EmptyText> : (
              <ul className="divide-y">{contactos.slice(0, PREVIEW_LIMIT).map((contacto) => <ContactoRow key={contacto.id} contacto={contacto} />)}</ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Tratos relacionados</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <LoadingBlock /> : tratos.length === 0 ? <EmptyText>No hay tratos relacionados.</EmptyText> : (
              <ul className="divide-y">{tratos.slice(0, PREVIEW_LIMIT).map((trato) => <TratoRow key={trato.id} trato={trato} />)}</ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CheckSquare className="h-4 w-4" /> Tareas relacionadas</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <LoadingBlock /> : tareas.length === 0 ? <EmptyText>No hay tareas relacionadas.</EmptyText> : (
              <ul className="divide-y">{tareas.slice(0, PREVIEW_LIMIT).map((tarea) => <TareaRow key={tarea.id} tarea={tarea} />)}</ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
