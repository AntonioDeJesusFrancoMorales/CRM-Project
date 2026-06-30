// DashboardPage — Inicio ejecutivo accionable, frontend-only.
// Deriva KPIs, alertas, próximas acciones y salud CRM desde hooks existentes.

import { useMemo } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertCircle,
  Building2,
  CalendarClock,
  Contact2,
  Download,
  Handshake,
  HeartPulse,
  Layers,
  ListTodo,
  Receipt,
  Rocket,
  ShieldAlert,
  Star,
  Target,
  Trophy,
  TrendingUp,
  UserCheck,
  UserPlus,
  Wallet,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useContactos } from '@/features/contactos/hooks/useContactos';
import { useEmpresas } from '@/features/empresas/hooks/useEmpresas';
import { useTareas } from '@/features/tareas/hooks/useTareas';
import { prioridadBadgeClass, prioridadLabels } from '@/features/tareas/lib/tareaBadges';
import { useTratos } from '@/features/tratos/hooks/useTratos';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { downloadTratosCsv } from '../lib/dashboardCsv';
import { computeDashboardInsights, type DashboardAlert } from '../lib/dashboardMetrics';

interface CsatResumen {
  promedio: number | null;
  total: number;
}

export function DashboardPage() {
  const now = useMemo(() => new Date(), []);
  const { data: tratos = [], isLoading: tratosLoading, isError: tratosError } = useTratos();
  const { data: contactos = [], isLoading: contactosLoading, isError: contactosError } = useContactos();
  const { data: tareas = [], isLoading: tareasLoading, isError: tareasError } = useTareas();
  const { data: empresas = [], isLoading: empresasLoading, isError: empresasError } = useEmpresas();
  const { data: usuarios = [], isLoading: usuariosLoading, isError: usuariosError } = useUsuarios();
  const { data: csat, isError: csatError } = useQuery<CsatResumen>({
    queryKey: ['wa-csat-resumen'],
    queryFn: () => apiClient.get<CsatResumen>(endpoints.wa.conversaciones.csatResumen()),
  });

  const loading = tratosLoading || contactosLoading || tareasLoading || empresasLoading || usuariosLoading;
  const hasPartialError = tratosError || contactosError || tareasError || empresasError || usuariosError || csatError;
  const insights = useMemo(
    () => computeDashboardInsights({ tratos, tareas, contactos, empresas, usuarios, now }),
    [tratos, tareas, contactos, empresas, usuarios, now],
  );
  const maxRanking = insights.ranking[0]?.valor ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inicio"
        description="Resumen ejecutivo del negocio y próximas acciones."
        actions={
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={tratos.length === 0 ? 0 : undefined}>
                <Button
                  variant="outline"
                  disabled={tratos.length === 0}
                  onClick={() => downloadTratosCsv(tratos, contactos, usuarios)}
                  className={tratos.length === 0 ? 'pointer-events-none' : undefined}
                >
                  <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                  Exportar tratos (CSV)
                </Button>
              </span>
            </TooltipTrigger>
            {tratos.length === 0 && (
              <TooltipContent>Crea tratos primero para poder exportarlos</TooltipContent>
            )}
          </Tooltip>
        }
      />

      {hasPartialError && (
        <Card className="border-amber-200 bg-amber-50 text-amber-950 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
          <CardContent className="flex items-start gap-3 p-4">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Algunas métricas pueden estar incompletas</p>
              <p className="text-sm opacity-80">
                Mostramos lo que pudo cargarse. Revisá conexión o reintentá desde el módulo afectado.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && contactos.length === 0 && tratos.length === 0 && empresas.length === 0 && (
        <PrimerosPasos />
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="KPIs ejecutivos">
        <StatCard label="Pipeline abierto" value={formatCurrency(insights.kpis.pipelineAbierto)} hint="Oportunidades abiertas" icon={Wallet} loading={loading} />
        <StatCard label="Pipeline ponderado" value={formatCurrency(insights.kpis.pipelinePonderado)} hint="Estimado × probabilidad" icon={TrendingUp} loading={loading} />
        <StatCard label="Tareas vencidas" value={String(insights.kpis.tareasVencidas)} hint="Sin completar" icon={AlertCircle} loading={loading} />
        <StatCard label="Cierres próximos" value={String(insights.kpis.cierresProximos30)} hint="Próximos 30 días" icon={CalendarClock} loading={loading} />
        <StatCard label="Oportunidades abiertas" value={String(insights.kpis.oportunidadesAbiertas)} icon={Layers} loading={loading} />
        <StatCard label="Ticket promedio" value={formatCurrency(insights.kpis.ticketPromedio)} icon={Receipt} loading={loading} />
        <StatCard label="Ganado este mes" value={formatCurrency(insights.kpis.valorGanadoMes)} hint={`${insights.kpis.ganadosMes} oportunidades`} icon={Target} loading={loading} />
        <StatCard label="Conversión" value={`${insights.kpis.conversion}%`} hint="Ganados / cerrados" icon={Activity} loading={loading} />
        <StatCard label="Clientes" value={String(insights.kpis.clientesActivos)} hint="Contactos activos" icon={UserCheck} loading={loading} />
        <StatCard label="Prospectos" value={String(insights.kpis.prospectos)} icon={Contact2} loading={loading} />
        <StatCard label="Leads del mes" value={String(insights.kpis.leadsMes)} hint="Contactos nuevos este mes" icon={UserPlus} loading={loading} />
        <StatCard label="CSAT promedio" value={csat?.promedio != null ? `${csat.promedio.toFixed(1)}/5` : '—'} hint={`${csat?.total ?? 0} respuestas`} icon={Star} loading={false} />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ActionAlerts alerts={insights.alerts} />
        <UpcomingActions items={insights.upcomingActions} />
        <UpcomingCloses items={insights.upcomingCloses} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CrmHealth items={insights.health} />
        <AgentRanking ranking={insights.ranking} maxValor={maxRanking} />
      </div>
    </div>
  );
}

function PrimerosPasos() {
  return (
    <Card className="border-dashed shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Rocket className="h-4 w-4 text-primary" aria-hidden="true" /> Primeros pasos
        </CardTitle>
        <CardDescription>Configurá la base comercial mínima para empezar a operar.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickStartLink to="/empresas" icon={Building2} title="1. Crea una empresa" description="Registra a tu primer cliente o prospecto." />
        <QuickStartLink to="/contactos" icon={Contact2} title="2. Agrega contactos" description="Suma a las personas con las que hablas." />
        <QuickStartLink to="/tratos" icon={Handshake} title="3. Crea una oportunidad" description="Da seguimiento a tu primer trato." />
      </CardContent>
    </Card>
  );
}

function QuickStartLink({
  to,
  icon: Icon,
  title,
  description,
}: {
  to: string;
  icon: typeof Building2;
  title: string;
  description: string;
}) {
  return (
    <Link to={to} className="flex flex-col gap-2 rounded-lg border p-4 text-sm transition-colors hover:bg-accent">
      <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      <span className="font-medium">{title}</span>
      <span className="text-muted-foreground">{description}</span>
    </Link>
  );
}

function ActionAlerts({ alerts }: { alerts: DashboardAlert[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" /> Alertas accionables
        </CardTitle>
        <CardDescription>Riesgos comerciales u operativos que conviene revisar hoy.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No hay alertas críticas por ahora.</p>
        ) : (
          alerts.slice(0, 6).map((alert) => (
            <Link key={alert.id} to={alert.to} className="block rounded-lg border p-3 transition-colors hover:bg-accent">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">{alert.description}</p>
                </div>
                <Badge className={alertBadgeClass(alert.severity)}>{alert.count}</Badge>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function UpcomingActions({ items }: { items: ReturnType<typeof computeDashboardInsights>['upcomingActions'] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ListTodo className="h-4 w-4 text-primary" aria-hidden="true" /> Próximas acciones
        </CardTitle>
        <CardDescription>Vencidas primero; después tareas próximas por prioridad.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No hay tareas vencidas ni próximas.</p>
        ) : (
          items.map((item) => (
            <Link key={item.tarea.id} to={`/tareas/${item.tarea.id}`} className="block rounded-lg border p-3 transition-colors hover:bg-accent">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">{item.tarea.titulo}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.trato?.nombre ?? 'Sin trato'} · {item.responsable?.nombre ?? 'Sin responsable'}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDueLabel(item.daysUntilDue)}</p>
                </div>
                <Badge variant="outline" className={prioridadBadgeClass[item.tarea.prioridad]}>
                  {prioridadLabels[item.tarea.prioridad]}
                </Badge>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function UpcomingCloses({ items }: { items: ReturnType<typeof computeDashboardInsights>['upcomingCloses'] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Próximos cierres
        </CardTitle>
        <CardDescription>Tratos abiertos con cierre esperado en los próximos 30 días.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No hay cierres próximos registrados.</p>
        ) : (
          items.map((item) => (
            <Link key={item.trato.id} to={`/tratos/${item.trato.id}`} className="block rounded-lg border p-3 transition-colors hover:bg-accent">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="truncate text-sm font-medium">{item.trato.nombre}</p>
                  <span className="text-sm font-medium tabular-nums">{formatCurrency(item.trato.valorEstimado)}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{item.contacto?.nombre ?? 'Sin contacto'}</span>
                  <span>·</span>
                  <span>{item.responsable?.nombre ?? 'Sin responsable'}</span>
                  <span>·</span>
                  <span>{formatDate(item.trato.fechaCierreEsperada)}</span>
                  <span>·</span>
                  <span>{item.daysUntilClose === 0 ? 'cierra hoy' : `en ${item.daysUntilClose} días`}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function CrmHealth({ items }: { items: ReturnType<typeof computeDashboardInsights>['health'] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HeartPulse className="h-4 w-4 text-primary" aria-hidden="true" /> Salud del CRM
        </CardTitle>
        <CardDescription>Higiene de datos que mejora seguimiento y reportes.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">La higiene de datos se ve bien.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <Link key={item.id} to={item.to} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent">
                <span className="text-sm font-medium">{item.label}</span>
                <Badge variant="outline">{item.count}</Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AgentRanking({ ranking, maxValor }: { ranking: ReturnType<typeof computeDashboardInsights>['ranking']; maxValor: number }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-amber-500" aria-hidden="true" /> Ranking de agentes
        </CardTitle>
        <CardDescription>Valor en pipeline asignado por responsable.</CardDescription>
      </CardHeader>
      <CardContent>
        {ranking.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay tratos asignados.</p>
        ) : (
          <div className="space-y-3">
            {ranking.map((agent) => (
              <div key={agent.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium">{agent.nombre}</span>
                  <span className="tabular-nums text-muted-foreground">{formatCurrency(agent.valor)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: maxValor > 0 ? `${(agent.valor / maxValor) * 100}%` : '0%' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function alertBadgeClass(severity: DashboardAlert['severity']): string {
  return cn(
    'border-transparent',
    severity === 'critical' && 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    severity === 'warning' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    severity === 'info' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  );
}

function formatDueLabel(daysUntilDue: number): string {
  if (daysUntilDue < 0) return `Vencida hace ${Math.abs(daysUntilDue)} día${Math.abs(daysUntilDue) === 1 ? '' : 's'}`;
  if (daysUntilDue === 0) return 'Vence hoy';
  if (daysUntilDue === 1) return 'Vence mañana';
  return `Vence en ${daysUntilDue} días`;
}
