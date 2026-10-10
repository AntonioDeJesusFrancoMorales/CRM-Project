// TratoInfoTab — grilla de campos del detalle de un trato.
// Modelo unificado: contactoId único, sin estado, motivoPerdida visible si != null.
// Presentational: recibe datos resueltos desde TratoDetailPage.

import { Link } from 'react-router';
import type { Trato } from '@/api/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { SensitiveField } from '@/features/permissions/components/PermissionState';
import { tipoContratoLabels } from '../lib/tipoContrato';

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

      <Field label="Valor estimado">
        <SensitiveField resource="TRATO" group="FINANCIERO">
          {formatCurrency(trato.valorEstimado)}
        </SensitiveField>
      </Field>

      <Field label="Probabilidad">
        <SensitiveField resource="TRATO" group="FINANCIERO">
          {trato.probabilidad !== null ? `${trato.probabilidad}%` : '—'}
        </SensitiveField>
      </Field>

      <Field label="Fecha de cierre esperada">
        <SensitiveField resource="TRATO" group="FINANCIERO">
          {formatDate(trato.fechaCierreEsperada)}
        </SensitiveField>
      </Field>

      {trato.motivoPerdida != null && (
        <div className="sm:col-span-2">
          <Field label="Motivo de pérdida">
            <SensitiveField resource="TRATO" group="FINANCIERO">
              <span className="whitespace-pre-wrap">{trato.motivoPerdida}</span>
            </SensitiveField>
          </Field>
        </div>
      )}

      <Field label="Creado">{formatDate(trato.creadoEn)}</Field>
      <Field label="Última actualización">{formatDate(trato.actualizadoEn)}</Field>
    </div>
  );
}
