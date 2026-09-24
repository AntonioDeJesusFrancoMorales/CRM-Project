// DashboardPage — Inicio ejecutivo accionable, frontend-only.
// Deriva KPIs, alertas, próximas acciones y salud CRM desde hooks existentes.

import { useMemo } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  Contact2,
  Download,
  Handshake,
  HeartPulse,
  Rocket,
  ShieldAlert,
  Star,
  Target,
  Trophy,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  const {
    data: contactos = [],
    isLoading: contactosLoading,
    isError: contactosError,
  } = useContactos();
  const { data: tareas = [], isLoading: tareasLoading, isError: tareasError } = useTareas();
  const { data: empresas = [], isLoading: empresasLoading, isError: empresasError } = useEmpresas();
  const { data: usuarios = [], isLoading: usuariosLoading, isError: usuariosError } = useUsuarios();
  const { data: csat, isError: csatError } = useQuery<CsatResumen>({
    queryKey: ['wa-csat-resumen'],
    queryFn: () => apiClient.get<CsatResumen>(endpoints.wa.conversaciones.csatResumen()),
  });

  const loading =
    tratosLoading || contactosLoading || tareasLoading || empresasLoading || usuariosLoading;
  const hasPartialError =
    tratosError || contactosError || tareasError || empresasError || usuariosError || csatError;
  const insights = useMemo(
    () => computeDashboardInsights({ tratos, tareas, contactos, empresas, usuarios, now }),
    [tratos, tareas, contactos, empresas, usuarios, now],
  );
  const maxRanking = insights.ranking[0]?.valor ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-[1480px] min-w-0 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Resumen ejecutivo
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">Inicio</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Una vista clara de tu operación comercial, cartera y próximas acciones.
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              tabIndex={tratos.length === 0 ? 0 : undefined}
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Button
                variant="outline"
                disabled={tratos.length === 0}
                onClick={() => downloadTratosCsv(tratos, contactos, usuarios)}
                className={cn(
                  'w-fit max-w-full gap-2',
                  tratos.length === 0 && 'pointer-events-none',
                )}
              >
                <Download aria-hidden="true" />
                Exportar tratos (CSV)
              </Button>
            </span>
          </TooltipTrigger>
          {tratos.length === 0 && (
            <TooltipContent>Crea tratos primero para poder exportarlos</TooltipContent>
          )}
        </Tooltip>
      </header>

      {hasPartialError && (
        <Card className="border-amber-200 bg-amber-50 text-amber-950 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
          <CardContent className="flex items-start gap-3 p-4">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">Algunas métricas pueden estar incompletas</p>
              <p className="text-sm opacity-80">
                Mostramos lo que pudo cargarse. Revisá conexión o reintentá desde el módulo
                afectado.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && contactos.length === 0 && tratos.length === 0 && empresas.length === 0 && (
        <PrimerosPasos />
      )}

      <section className="space-y-3" aria-labelledby="resumen-comercial">
        <h2 id="resumen-comercial" className="text-sm font-semibold text-muted-foreground">
          Resumen comercial
        </h2>
        <div
          className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="KPIs ejecutivos"
        >
          <PrimaryKpiCard
            label="Pipeline abierto"
            value={formatCurrency(insights.kpis.pipelineAbierto)}
            hint="Oportunidades abiertas"
            icon={Wallet}
            tone="blue"
            loading={loading}
          />
          <PrimaryKpiCard
            label="Pipeline ponderado"
            value={formatCurrency(insights.kpis.pipelinePonderado)}
            hint="Estimado × probabilidad"
            icon={TrendingUp}
            tone="violet"
            loading={loading}
          />
          <PrimaryKpiCard
            label="Ganado este mes"
            value={formatCurrency(insights.kpis.valorGanadoMes)}
            hint={`${insights.kpis.ganadosMes} oportunidades`}
            icon={Target}
            tone="emerald"
            loading={loading}
          />
          <PrimaryKpiCard
            label="Conversión"
            value={`${insights.kpis.conversion}%`}
            hint="Ganados / cerrados"
            icon={Activity}
            tone="amber"
            loading={loading}
          />
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
        <div className="contents lg:block lg:space-y-4">
          <div className="order-1 min-w-0">
            <UpcomingActions items={insights.upcomingActions} />
          </div>
          <div className="order-3 min-w-0">
            <UpcomingCloses items={insights.upcomingCloses} />
          </div>
          <div className="order-5 min-w-0">
            <CrmHealth items={insights.health} />
          </div>
        </div>
        <div className="contents lg:block lg:space-y-4">
          <div className="order-2 min-w-0">
            <PortfolioPanel insights={insights} csat={csat} loading={loading} />
          </div>
          <div className="order-4 min-w-0">
            <ActionAlerts alerts={insights.alerts} />
          </div>
          <div className="order-6 min-w-0">
            <AgentRanking ranking={insights.ranking} maxValor={maxRanking} />
          </div>
        </div>
      </div>
    </div>
  );
}

type MetricTone = 'blue' | 'violet' | 'emerald' | 'amber';

const metricToneClasses: Record<MetricTone, string> = {
  blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300',
  violet: 'bg-violet-500/10 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300',
  amber: 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300',
};

function PrimaryKpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  loading,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: MetricTone;
  loading: boolean;
}) {
  return (
    <Card className="min-w-0">
      <CardContent className="p-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 truncate text-2xl font-semibold tracking-tight tabular-nums">
              {loading ? '—' : value}
            </p>
          </div>
          <div
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg',
              metricToneClasses[tone],
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function PortfolioPanel({
  insights,
  csat,
  loading,
}: {
  insights: ReturnType<typeof computeDashboardInsights>;
  csat: CsatResumen | undefined;
  loading: boolean;
}) {
  const metrics: Array<{
    label: string;
    value: string;
    icon: LucideIcon;
    tone: MetricTone;
    hint?: string;
  }> = [
    {
      label: 'Tareas vencidas',
      value: String(insights.kpis.tareasVencidas),
      icon: AlertCircle,
      tone: 'amber',
    },
    {
      label: 'Cierres próximos',
      value: String(insights.kpis.cierresProximos30),
      icon: Target,
      tone: 'emerald',
    },
    {
      label: 'Oportunidades abiertas',
      value: String(insights.kpis.oportunidadesAbiertas),
      icon: Handshake,
      tone: 'blue',
    },
    {
      label: 'Ticket promedio',
      value: formatCurrency(insights.kpis.ticketPromedio),
      icon: Wallet,
      tone: 'violet',
    },
    { label: 'Clientes', value: String(insights.kpis.clientesActivos), icon: Users, tone: 'blue' },
    { label: 'Prospectos', value: String(insights.kpis.prospectos), icon: Contact2, tone: 'amber' },
    {
      label: 'Leads del mes',
      value: String(insights.kpis.leadsMes),
      icon: TrendingUp,
      tone: 'violet',
    },
    {
      label: 'CSAT promedio',
      value: csat?.promedio != null ? `${csat.promedio.toFixed(1)}/5` : '—',
      icon: Star,
      tone: 'amber',
      hint: `${csat?.total ?? 0} respuestas`,
    },
  ];
  return (
    <Card className="min-w-0" role="region" aria-labelledby="cartera-comercial">
      <CardHeader className="border-b bg-muted/20">
        <h2 id="cartera-comercial" className="flex items-center gap-2 text-base font-medium">
          <BarChart3 className="size-4 text-primary" aria-hidden="true" />
          Cartera comercial
        </h2>
        <CardDescription>Indicadores operativos del portafolio actual.</CardDescription>
      </CardHeader>
      <CardContent className="grid min-w-0 grid-cols-2 gap-3 p-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="min-w-0 rounded-lg border bg-muted/20 p-3">
              <div className="flex min-w-0 items-start gap-2">
                <p className="min-h-8 min-w-0 flex-1 break-words text-xs leading-4 text-muted-foreground">
                  {metric.label}
                </p>
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-md',
                    metricToneClasses[metric.tone],
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-2 break-words text-lg font-semibold tabular-nums">
                {loading ? '—' : metric.value}
              </p>
              {metric.hint && (
                <p className="mt-1 break-words text-[11px] text-muted-foreground">{metric.hint}</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
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
        <QuickStartLink
          to="/empresas"
          icon={Building2}
          title="1. Crea una empresa"
          description="Registra a tu primer cliente o prospecto."
        />
        <QuickStartLink
          to="/contactos"
          icon={Contact2}
          title="2. Agrega contactos"
          description="Suma a las personas con las que hablas."
        />
        <QuickStartLink
          to="/tratos"
          icon={Handshake}
          title="3. Crea una oportunidad"
          description="Da seguimiento a tu primer trato."
        />
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
    <Link
      to={to}
      className="flex min-w-0 flex-col gap-2 rounded-lg border p-4 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
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

function UpcomingActions({
  items,
}: {
  items: ReturnType<typeof computeDashboardInsights>['upcomingActions'];
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b bg-muted/20">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-medium">
            <CalendarDays className="size-4 text-primary" aria-hidden="true" />
            Próximas acciones
          </h2>
          <CardDescription className="mt-1">
            Vencidas primero; después tareas próximas por prioridad.
          </CardDescription>
        </div>
        <Link
          to="/tareas?tab=lista"
          className="inline-flex shrink-0 items-center rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Ver tareas
          <ArrowRight className="ml-1 size-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent className="pt-5">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No hay tareas vencidas ni próximas.
          </p>
        ) : (
          <div className="relative space-y-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-border">
            {items.map((item) => (
              <Link
                key={item.tarea.id}
                to={`/tareas/${item.tarea.id}`}
                className="group relative flex min-w-0 gap-4 rounded-lg p-1 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className="z-10 mt-1 size-3.5 shrink-0 rounded-full border-2 border-background bg-primary ring-1 ring-primary/30"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {item.tarea.titulo}
                    </p>
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">
                      {formatDueLabel(item.daysUntilDue)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {item.trato?.nombre ?? 'Sin trato'} ·{' '}
                    {item.responsable?.nombre ?? 'Sin responsable'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={prioridadBadgeClass[item.tarea.prioridad]}>
                      {prioridadLabels[item.tarea.prioridad]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        item.status === 'vencida'
                          ? 'border-red-500/20 bg-red-500/10 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300'
                          : 'border-primary/20 bg-primary/10 text-primary'
                      }
                    >
                      {item.status === 'vencida' ? 'Vencida' : 'Próxima'}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
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
