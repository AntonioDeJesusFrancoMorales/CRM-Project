import { Link } from 'react-router';
import type { ComoNosConocio, EstadoPosibleCliente, Prospecto } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatRelativeDate } from '@/lib/format';

// ── Labels ─────────────────────────────────────────────────────────────────

const estadoLabels: Record<EstadoPosibleCliente, string> = {
  frio: 'Frío',
  tibio: 'Tibio',
  caliente: 'Caliente',
  convertido: 'Convertido',
};

const estadoClasses: Record<EstadoPosibleCliente, string> = {
  frio: 'bg-blue-100 text-blue-700 border-transparent',
  tibio: 'bg-yellow-100 text-yellow-700 border-transparent',
  caliente: 'bg-red-100 text-red-700 border-transparent',
  convertido: 'bg-green-100 text-green-700 border-transparent',
};

const comoNosConocioLabels: Record<ComoNosConocio, string> = {
  referido: 'Referido',
  redes_sociales: 'Redes sociales',
  busqueda: 'Búsqueda',
  evento: 'Evento',
  otro: 'Otro',
};

// ── Props ───────────────────────────────────────────────────────────────────

interface ProspectoInfoTabProps {
  prospecto: Prospecto;
  /** Nombre de la empresa, resuelto por el container */
  empresaNombre?: string;
  /** Nombre del responsable, resuelto por el container */
  responsableNombre?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Tab de información del detalle de un Prospecto.
 * Presentational — recibe datos resueltos; no llama hooks.
 * REQ-PROS-DETALLE-001, REQ-PROS-DETALLE-003
 */
export function ProspectoInfoTab({
  prospecto,
  empresaNombre,
  responsableNombre,
}: ProspectoInfoTabProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Contacto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información de contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Nombre</p>
            <p className="mt-1 text-sm">{prospecto.nombre_contacto}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Correo</p>
            {prospecto.correo_contacto ? (
              <a
                href={`mailto:${prospecto.correo_contacto}`}
                className="mt-1 block text-sm text-primary underline underline-offset-4 hover:text-primary/80"
              >
                {prospecto.correo_contacto}
              </a>
            ) : (
              <p className="mt-1 text-sm">—</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
            <p className="mt-1 text-sm">{prospecto.telefono_contacto ?? '—'}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Cargo</p>
            <p className="mt-1 text-sm">{prospecto.cargo_contacto ?? '—'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Datos del pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Estado</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge className={estadoClasses[prospecto.estado_posible_cliente]}>
                {estadoLabels[prospecto.estado_posible_cliente]}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Empresa</p>
            {empresaNombre ? (
              <Link
                to={`/empresas/${prospecto.empresa_id}`}
                className="mt-1 block text-sm text-primary underline underline-offset-4 hover:text-primary/80"
              >
                {empresaNombre}
              </Link>
            ) : (
              <p className="mt-1 text-sm">—</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Responsable</p>
            <p className="mt-1 text-sm">{responsableNombre ?? '—'}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">¿Cómo nos conoció?</p>
            <p className="mt-1 text-sm">
              {prospecto.como_nos_conocio
                ? comoNosConocioLabels[prospecto.como_nos_conocio]
                : '—'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notas */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Notas</CardTitle>
        </CardHeader>
        <CardContent>
          {prospecto.notas ? (
            <p className="text-sm whitespace-pre-wrap">{prospecto.notas}</p>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </CardContent>
      </Card>

      {/* Registro */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Registro</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Fecha de registro</p>
            <p className="mt-1 text-sm">{formatDate(prospecto.creado_en)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Última actualización</p>
            <p className="mt-1 text-sm">{formatRelativeDate(prospecto.actualizado_en)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
