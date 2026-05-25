// TratoInfoTab — grilla de campos del detalle de un trato.
// Presentational: recibe datos resueltos desde TratoDetailPage.
// Extraído de TratoDetailPage en el refactor ADR-051.

import { Link } from 'react-router';
import type { TipoContrato, Trato } from '@/api/types';
import { formatDate } from '@/lib/format';

const tipoContratoLabels: Record<TipoContrato, string> = {
  precio_fijo: 'Precio fijo',
  tiempo_materiales: 'Tiempo y materiales',
  retainer: 'Retainer',
};

function formatCurrency(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value);
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

interface TratoInfoTabProps {
  trato: Trato;
  /** Nombre del cliente vinculado, resuelto por el container */
  clienteNombre?: string;
  /** ID del cliente vinculado, resuelto por el container */
  clienteId?: string;
  /** Nombre del prospecto vinculado, resuelto por el container */
  prospectoNombre?: string;
  /** ID del prospecto vinculado, resuelto por el container */
  prospectoId?: string;
  /** Nombre del responsable, resuelto por el container */
  responsableNombre?: string;
}

/**
 * Tab de información del detalle de un Trato.
 * Presentational — recibe datos resueltos; no llama hooks.
 * ADR-051.
 */
export function TratoInfoTab({
  trato,
  clienteNombre,
  clienteId,
  prospectoNombre,
  prospectoId,
  responsableNombre,
}: TratoInfoTabProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <Field label="Vinculado a">
        {clienteId && clienteNombre ? (
          <Link to={`/clientes/${clienteId}`} className="text-primary hover:underline">
            {clienteNombre} (cliente)
          </Link>
        ) : prospectoId && prospectoNombre ? (
          <Link to={`/prospectos/${prospectoId}`} className="text-primary hover:underline">
            {prospectoNombre} (prospecto)
          </Link>
        ) : (
          '—'
        )}
      </Field>

      <Field label="Responsable">{responsableNombre ?? '—'}</Field>

      <Field label="Valor estimado">{formatCurrency(trato.valor_estimado)}</Field>

      <Field label="Probabilidad">
        {trato.probabilidad !== null ? `${trato.probabilidad}%` : '—'}
      </Field>

      <Field label="Fecha de cierre esperada">
        {formatDate(trato.fecha_cierre_esperada)}
      </Field>

      <Field label="Tipo de contrato">
        {trato.tipo_contrato ? tipoContratoLabels[trato.tipo_contrato] : '—'}
      </Field>

      {trato.estado === 'perdido' && (
        <div className="sm:col-span-2 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Motivo de pérdida
          </p>
          <p className="text-sm whitespace-pre-wrap">{trato.motivo_perdida ?? '—'}</p>
        </div>
      )}

      <Field label="Creado">{formatDate(trato.creado_en)}</Field>
      <Field label="Última actualización">{formatDate(trato.actualizado_en)}</Field>
    </div>
  );
}
