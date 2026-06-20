// DashboardPage — KPIs del negocio calculados client-side desde los get-all
// existentes (tratos, contactos, tareas, usuarios). Sin endpoint nuevo: el volumen
// es bajo. "Ganados/conversión/CSAT" llegan con las Fases 3 y 4 (estado del trato y CSAT).

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet, TrendingUp, Layers, Receipt, UserCheck, UserPlus, Contact2, AlertCircle, Trophy, Download, Target, Percent, Star,
} from 'lucide-react';
import type { Contacto, Tarea, Trato, Usuario } from '@/api/types';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { formatCurrency } from '@/lib/format';
import { useTratos } from '@/features/tratos/hooks/useTratos';
import { useContactos } from '@/features/contactos/hooks/useContactos';
import { useTareas } from '@/features/tareas/hooks/useTareas';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';

interface CsatResumen { promedio: number | null; total: number }

function esEsteMes(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function computeKpis(tratos: Trato[], contactos: Contacto[], tareas: Tarea[]) {
  const abiertos = tratos.filter((t) => t.estado === 'ABIERTO');
  const pipeline = abiertos.reduce((acc, t) => acc + (t.valorEstimado ?? 0), 0);
  const ponderado = abiertos.reduce((acc, t) => acc + (t.valorEstimado ?? 0) * ((t.probabilidad ?? 0) / 100), 0);
  const oportunidades = abiertos.length;
  const ticket = oportunidades > 0 ? pipeline / oportunidades : 0;
  const clientes = contactos.filter((c) => c.estadoRelacion === 'ACTIVO').length;
  const prospectos = contactos.filter((c) => c.estadoRelacion === 'PROSPECTO').length;
  const leadsMes = contactos.filter((c) => esEsteMes(c.creadoEn)).length;
  const hoy = new Date();
  const tareasUrgentes = tareas.filter(
    (t) => !t.fechaCompletada && t.fechaLimite && new Date(t.fechaLimite) <= hoy,
  ).length;
  // Cierres: ganados del mes y conversión (ganados / cerrados).
  const ganados = tratos.filter((t) => t.estado === 'GANADO');
  const ganadosMes = ganados.filter((t) => esEsteMes(t.actualizadoEn ?? t.creadoEn));
  const valorGanadoMes = ganadosMes.reduce((acc, t) => acc + (t.valorEstimado ?? 0), 0);
  const perdidos = tratos.filter((t) => t.estado === 'PERDIDO').length;
  const cerrados = ganados.length + perdidos;
  const conversion = cerrados > 0 ? Math.round((ganados.length / cerrados) * 100) : 0;
  return {
    pipeline, ponderado, oportunidades, ticket, clientes, prospectos, leadsMes, tareasUrgentes,
    ganadosMes: ganadosMes.length, valorGanadoMes, conversion,
  };
}

function rankingAgentes(tratos: Trato[], usuarios: Usuario[]) {
  const porAgente = new Map<string, number>();
  for (const t of tratos) {
    if (!t.responsableId) continue;
    porAgente.set(t.responsableId, (porAgente.get(t.responsableId) ?? 0) + (t.valorEstimado ?? 0));
  }
  const nombre = (id: string) => usuarios.find((u) => u.id === id)?.nombre ?? 'Sin asignar';
  return [...porAgente.entries()]
    .map(([id, valor]) => ({ id, nombre: nombre(id), valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8);
}

function exportarTratosCsv(tratos: Trato[], contactos: Contacto[], usuarios: Usuario[]) {
  const contacto = (id: string) => contactos.find((c) => c.id === id)?.nombre ?? '';
  const usuario = (id: string | null) => (id ? usuarios.find((u) => u.id === id)?.nombre ?? '' : '');
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const filas = tratos.map((t) => [
    t.nombre, contacto(t.contactoId), usuario(t.responsableId), t.valorEstimado ?? 0,
    t.probabilidad ?? 0, t.tipoContrato, t.creadoEn,
  ].map(esc).join(','));
  const csv = ['Nombre,Contacto,Responsable,Valor,Probabilidad,Tipo,Creado', ...filas].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tratos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function DashboardPage() {
  const { data: tratos = [], isLoading: lt } = useTratos();
  const { data: contactos = [], isLoading: lc } = useContactos();
  const { data: tareas = [] } = useTareas();
  const { data: usuarios = [] } = useUsuarios();
  const { data: csat } = useQuery<CsatResumen>({
    queryKey: ['wa-csat-resumen'],
    queryFn: () => apiClient.get<CsatResumen>(endpoints.wa.conversaciones.csatResumen()),
  });

  const loading = lt || lc;
  const kpis = useMemo(() => computeKpis(tratos, contactos, tareas), [tratos, contactos, tareas]);
  const ranking = useMemo(() => rankingAgentes(tratos, usuarios), [tratos, usuarios]);
  const maxValor = ranking[0]?.valor ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inicio"
        description="Resumen del negocio."
        actions={
          <Button
            variant="outline"
            disabled={tratos.length === 0}
            onClick={() => exportarTratosCsv(tratos, contactos, usuarios)}
          >
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Exportar tratos (CSV)
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Valor pipeline" value={formatCurrency(kpis.pipeline)} hint="Oportunidades abiertas" icon={Wallet} loading={loading} />
        <StatCard label="Pipeline ponderado" value={formatCurrency(kpis.ponderado)} hint="Estimado × probabilidad" icon={TrendingUp} loading={loading} />
        <StatCard label="Oportunidades abiertas" value={String(kpis.oportunidades)} icon={Layers} loading={loading} />
        <StatCard label="Ticket promedio" value={formatCurrency(kpis.ticket)} icon={Receipt} loading={loading} />
        <StatCard label="Ganado este mes" value={formatCurrency(kpis.valorGanadoMes)} hint={`${kpis.ganadosMes} oportunidades`} icon={Target} loading={loading} />
        <StatCard label="Conversión" value={`${kpis.conversion}%`} hint="Ganados / cerrados" icon={Percent} loading={loading} />
        <StatCard label="Clientes" value={String(kpis.clientes)} hint="Contactos activos" icon={UserCheck} loading={loading} />
        <StatCard label="Prospectos" value={String(kpis.prospectos)} icon={Contact2} loading={loading} />
        <StatCard label="Leads del mes" value={String(kpis.leadsMes)} hint="Contactos nuevos este mes" icon={UserPlus} loading={loading} />
        <StatCard label="Tareas urgentes" value={String(kpis.tareasUrgentes)} hint="Pendientes y vencidas" icon={AlertCircle} loading={loading} />
        <StatCard
          label="CSAT promedio"
          value={csat?.promedio != null ? `${csat.promedio.toFixed(1)}/5` : '—'}
          hint={`${csat?.total ?? 0} respuestas`}
          icon={Star}
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" /> Ranking de agentes (valor en pipeline)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ranking.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Aún no hay tratos asignados.</p>
          ) : (
            <div className="space-y-3">
              {ranking.map((a) => (
                <div key={a.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{a.nombre}</span>
                    <span className="tabular-nums text-muted-foreground">{formatCurrency(a.valor)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: maxValor > 0 ? `${(a.valor / maxValor) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
