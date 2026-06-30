import type { Contacto, Empresa, Tarea, Trato, Usuario } from '@/api/types';

export interface DashboardInput {
  tratos: Trato[];
  tareas: Tarea[];
  contactos: Contacto[];
  empresas: Empresa[];
  usuarios: Usuario[];
  now?: Date;
}

export interface DashboardKpis {
  pipelineAbierto: number;
  pipelinePonderado: number;
  oportunidadesAbiertas: number;
  ticketPromedio: number;
  tareasVencidas: number;
  cierresProximos30: number;
  clientesActivos: number;
  prospectos: number;
  leadsMes: number;
  conversion: number;
  valorGanadoMes: number;
  ganadosMes: number;
}

export interface DashboardAlert {
  id: string;
  title: string;
  description: string;
  count: number;
  to: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface UpcomingAction {
  tarea: Tarea;
  trato: Trato | undefined;
  responsable: Usuario | undefined;
  status: 'vencida' | 'proxima';
  daysUntilDue: number;
}

export interface UpcomingClose {
  trato: Trato;
  contacto: Contacto | undefined;
  responsable: Usuario | undefined;
  daysUntilClose: number;
}

export interface HealthItem {
  id: string;
  label: string;
  count: number;
  to: string;
}

export interface AgentRankingItem {
  id: string;
  nombre: string;
  valor: number;
}

export interface DashboardInsights {
  kpis: DashboardKpis;
  alerts: DashboardAlert[];
  upcomingActions: UpcomingAction[];
  upcomingCloses: UpcomingClose[];
  health: HealthItem[];
  ranking: AgentRankingItem[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function computeDashboardInsights(input: DashboardInput): DashboardInsights {
  const now = input.now ?? new Date();
  const tratosAbiertos = input.tratos.filter((trato) => trato.estado === 'ABIERTO');
  const tareasVencidas = input.tareas.filter((tarea) => isOverdueTask(tarea, now));
  const upcomingCloses = getUpcomingCloses(input, now, 30);
  const health = getHealthItems(input);
  const alerts = getAlerts(input, tareasVencidas.length, upcomingCloses.length, health, now);

  return {
    kpis: computeKpis(input, tratosAbiertos, tareasVencidas.length, upcomingCloses.length, now),
    alerts,
    upcomingActions: getUpcomingActions(input, now, 8),
    upcomingCloses,
    health,
    ranking: getAgentRanking(input.tratos, input.usuarios),
  };
}

function computeKpis(
  input: DashboardInput,
  tratosAbiertos: Trato[],
  tareasVencidas: number,
  cierresProximos30: number,
  now: Date,
): DashboardKpis {
  const pipelineAbierto = tratosAbiertos.reduce(
    (acc, trato) => acc + (trato.valorEstimado ?? 0),
    0,
  );
  const pipelinePonderado = tratosAbiertos.reduce(
    (acc, trato) => acc + (trato.valorEstimado ?? 0) * ((trato.probabilidad ?? 0) / 100),
    0,
  );
  const ganados = input.tratos.filter((trato) => trato.estado === 'GANADO');
  const perdidos = input.tratos.filter((trato) => trato.estado === 'PERDIDO');
  const ganadosMes = ganados.filter((trato) => isSameMonth(trato.actualizadoEn ?? trato.creadoEn, now));
  const cerrados = ganados.length + perdidos.length;

  return {
    pipelineAbierto,
    pipelinePonderado,
    oportunidadesAbiertas: tratosAbiertos.length,
    ticketPromedio: tratosAbiertos.length > 0 ? pipelineAbierto / tratosAbiertos.length : 0,
    tareasVencidas,
    cierresProximos30,
    clientesActivos: input.contactos.filter((contacto) => contacto.estadoRelacion === 'ACTIVO').length,
    prospectos: input.contactos.filter((contacto) => contacto.estadoRelacion === 'PROSPECTO').length,
    leadsMes: input.contactos.filter((contacto) => isSameMonth(contacto.creadoEn, now)).length,
    conversion: cerrados > 0 ? Math.round((ganados.length / cerrados) * 100) : 0,
    valorGanadoMes: ganadosMes.reduce((acc, trato) => acc + (trato.valorEstimado ?? 0), 0),
    ganadosMes: ganadosMes.length,
  };
}

function getAlerts(
  input: DashboardInput,
  tareasVencidasCount: number,
  upcomingClosesCount: number,
  health: HealthItem[],
  now: Date,
): DashboardAlert[] {
  const dealsWithoutNextTask = getOpenDealsWithoutFutureTask(input.tratos, input.tareas, now).length;
  const companiesWithoutOwner = health.find((item) => item.id === 'companies-without-owner')?.count ?? 0;
  const contactsWithoutEmail = health.find((item) => item.id === 'contacts-without-email')?.count ?? 0;
  const dealsWithoutCloseDate = health.find((item) => item.id === 'deals-without-close-date')?.count ?? 0;

  const alerts: DashboardAlert[] = [
    {
      id: 'overdue-tasks',
      title: 'Tareas vencidas',
      description: 'Hay tareas sin completar con fecha límite pasada.',
      count: tareasVencidasCount,
      to: '/tareas?tab=lista',
      severity: 'critical',
    },
    {
      id: 'deals-without-next-task',
      title: 'Tratos sin próxima acción',
      description: 'Tratos abiertos sin una tarea futura asociada.',
      count: dealsWithoutNextTask,
      to: '/tratos?tab=lista',
      severity: 'warning',
    },
    {
      id: 'upcoming-closes',
      title: 'Cierres próximos',
      description: 'Tratos abiertos con cierre esperado en los próximos 30 días.',
      count: upcomingClosesCount,
      to: '/tratos?tab=lista',
      severity: 'info',
    },
    {
      id: 'companies-without-owner',
      title: 'Empresas sin responsable',
      description: 'Empresas que necesitan dueño comercial asignado.',
      count: companiesWithoutOwner,
      to: '/empresas',
      severity: 'warning',
    },
    {
      id: 'contacts-without-email',
      title: 'Contactos sin correo',
      description: 'Contactos con datos incompletos para seguimiento.',
      count: contactsWithoutEmail,
      to: '/contactos',
      severity: 'info',
    },
    {
      id: 'deals-without-close-date',
      title: 'Tratos sin fecha de cierre',
      description: 'Oportunidades abiertas sin cierre esperado definido.',
      count: dealsWithoutCloseDate,
      to: '/tratos?tab=lista',
      severity: 'warning',
    },
  ];

  return alerts.filter((alert) => alert.count > 0);
}

export function getUpcomingActions(
  input: DashboardInput,
  now: Date = new Date(),
  limit = 8,
): UpcomingAction[] {
  const tratosById = new Map(input.tratos.map((trato) => [trato.id, trato]));
  const usuariosById = new Map(input.usuarios.map((usuario) => [usuario.id, usuario]));

  return input.tareas
    .filter((tarea) => tarea.fechaCompletada === null)
    .map((tarea) => {
      const daysUntilDue = daysBetween(now, new Date(tarea.fechaLimite));
      return {
        tarea,
        trato: tratosById.get(tarea.tratoId),
        responsable: usuariosById.get(tarea.responsableId),
        status: daysUntilDue < 0 ? 'vencida' : 'proxima',
        daysUntilDue,
      } satisfies UpcomingAction;
    })
    .filter((item) => item.status === 'vencida' || item.daysUntilDue <= 7)
    .sort(compareUpcomingActions)
    .slice(0, limit);
}

export function getUpcomingCloses(
  input: DashboardInput,
  now: Date = new Date(),
  days = 30,
): UpcomingClose[] {
  const contactosById = new Map(input.contactos.map((contacto) => [contacto.id, contacto]));
  const usuariosById = new Map(input.usuarios.map((usuario) => [usuario.id, usuario]));

  return input.tratos
    .filter((trato) => trato.estado === 'ABIERTO' && trato.fechaCierreEsperada !== null)
    .map((trato) => ({
      trato,
      contacto: contactosById.get(trato.contactoId),
      responsable: usuariosById.get(trato.responsableId),
      daysUntilClose: daysBetween(now, new Date(trato.fechaCierreEsperada ?? '')),
    }))
    .filter((item) => item.daysUntilClose >= 0 && item.daysUntilClose <= days)
    .sort((a, b) => a.daysUntilClose - b.daysUntilClose)
    .slice(0, 8);
}

function getHealthItems(input: DashboardInput): HealthItem[] {
  const companiesWithoutOwner = input.empresas.filter((empresa) => empresa.responsableId === null).length;
  const contactsWithoutEmail = input.contactos.filter((contacto) => !contacto.correo).length;
  const dealsWithoutCloseDate = input.tratos.filter(
    (trato) => trato.estado === 'ABIERTO' && trato.fechaCierreEsperada === null,
  ).length;
  const tasksWithoutDescription = input.tareas.filter((tarea) => !tarea.descripcion).length;

  return [
    { id: 'companies-without-owner', label: 'Empresas sin responsable', count: companiesWithoutOwner, to: '/empresas' },
    { id: 'contacts-without-email', label: 'Contactos sin correo', count: contactsWithoutEmail, to: '/contactos' },
    { id: 'deals-without-close-date', label: 'Tratos sin cierre esperado', count: dealsWithoutCloseDate, to: '/tratos?tab=lista' },
    { id: 'tasks-without-description', label: 'Tareas sin descripción', count: tasksWithoutDescription, to: '/tareas?tab=lista' },
  ].filter((item) => item.count > 0);
}

function getAgentRanking(tratos: Trato[], usuarios: Usuario[]): AgentRankingItem[] {
  const usuariosById = new Map(usuarios.map((usuario) => [usuario.id, usuario]));
  const porAgente = new Map<string, number>();

  for (const trato of tratos) {
    porAgente.set(trato.responsableId, (porAgente.get(trato.responsableId) ?? 0) + (trato.valorEstimado ?? 0));
  }

  return [...porAgente.entries()]
    .map(([id, valor]) => ({ id, nombre: usuariosById.get(id)?.nombre ?? 'Sin asignar', valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8);
}

function getOpenDealsWithoutFutureTask(tratos: Trato[], tareas: Tarea[], now: Date): Trato[] {
  return tratos.filter((trato) => {
    if (trato.estado !== 'ABIERTO') return false;
    return !tareas.some(
      (tarea) =>
        tarea.tratoId === trato.id &&
        tarea.fechaCompletada === null &&
        new Date(tarea.fechaLimite) >= now,
    );
  });
}

function compareUpcomingActions(a: UpcomingAction, b: UpcomingAction): number {
  if (a.status !== b.status) return a.status === 'vencida' ? -1 : 1;
  const priorityDiff = priorityWeight(b.tarea.prioridad) - priorityWeight(a.tarea.prioridad);
  if (priorityDiff !== 0) return priorityDiff;
  return new Date(a.tarea.fechaLimite).getTime() - new Date(b.tarea.fechaLimite).getTime();
}

function priorityWeight(priority: Tarea['prioridad']): number {
  switch (priority) {
    case 'URGENTE':
      return 4;
    case 'ALTA':
      return 3;
    case 'MEDIA':
      return 2;
    case 'BAJA':
      return 1;
  }
}

function isOverdueTask(tarea: Tarea, now: Date): boolean {
  return tarea.fechaCompletada === null && new Date(tarea.fechaLimite) < now;
}

function isSameMonth(iso: string, now: Date): boolean {
  const date = new Date(iso);
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function daysBetween(start: Date, end: Date): number {
  return Math.ceil((startOfDay(end).getTime() - startOfDay(start).getTime()) / DAY_MS);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
