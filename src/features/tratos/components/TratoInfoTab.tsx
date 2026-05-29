// TratoInfoTab — grilla de campos del detalle de un trato.
// Modelo unificado: contactoId único, sin estado, motivoPerdida visible si != null.
// Presentational: recibe datos resueltos desde TratoDetailPage.

import { Link } from 'react-router';
import type { TipoContrato, Trato } from '@/api/types';
import { formatDate } from '@/lib/format';

const tipoContratoLabels: Record<TipoContrato, string> = {
  SERVICIO: 'Servicio',
  LICENCIA: 'Licencia',
  SUSCRIPCION: 'Suscripción',
  PERMANENTE: 'Permanente',
  OTRO: 'Otro',
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
  /** Nombre del contacto vinculado, resuelto por el container */
  contactoNombre?: string;
  /** ID del contacto vinculado, para el link */
  contactoId?: string;
  /** Nombre del responsable, resuelto por el container */
  responsableNombre?: string;
}

/**
 * Tab de información del detalle de un Trato.
 * Presentational — recibe datos resueltos; no llama hooks.
 * Modelo unificado: sin estado, sin cliente/prospecto separado.
 */
export function TratoInfoTab({
  trato,
  contactoNombre,
  contactoId,
  responsableNombre,
}: TratoInfoTabProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <Field label="Contacto">
        {contactoId && contactoNombre ? (
          <Link to={`/contactos/${contactoId}`} className="text-primary hover:underline">
            {contactoNombre}
          </Link>
        ) : (
          '—'
        )}
      </Field>

      <Field label="Responsable">{responsableNombre ?? '—'}</Field>

      <Field label="Tipo de contrato">
        {tipoContratoLabels[trato.tipoContrato]}
      </Field>

      <Field label="Valor estimado">{formatCurrency(trato.valorEstimado)}</Field>

      <Field label="Probabilidad">
        {trato.probabilidad !== null ? `${trato.probabilidad}%` : '—'}
      </Field>

      <Field label="Fecha de cierre esperada">
        {formatDate(trato.fechaCierreEsperada)}
      </Field>

      {trato.motivoPerdida != null && (
        <div className="sm:col-span-2">
          <Field label="Motivo de pérdida">
            <span className="whitespace-pre-wrap">{trato.motivoPerdida}</span>
          </Field>
        </div>
      )}

      <Field label="Creado">{formatDate(trato.creadoEn)}</Field>
      <Field label="Última actualización">{formatDate(trato.actualizadoEn)}</Field>
    </div>
  );
}
