import { Link } from 'react-router';
import type { ComoNosConocio, Cliente } from '@/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatRelativeDate } from '@/lib/format';

// ADR-039 T_D.7: presentacional puro — recibe datos resueltos, no llama hooks.

const comoNosConocioLabels: Record<ComoNosConocio, string> = {
  referido: 'Referido',
  redes_sociales: 'Redes sociales',
  busqueda: 'Búsqueda',
  evento: 'Evento',
  otro: 'Otro',
};

interface ClienteInfoTabProps {
  cliente: Cliente;
  /** Nombre de la empresa, resuelto por el container */
  empresaNombre?: string;
  /** Nombre del responsable, resuelto por el container */
  responsableNombre?: string;
}

/**
 * Tab de información del detalle de un Cliente.
 * Presentational — recibe datos resueltos; no llama hooks.
 * REQ-05, REQ-06
 */
export function ClienteInfoTab({ cliente, empresaNombre, responsableNombre }: ClienteInfoTabProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Información de contacto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información de contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Nombre</p>
            <p className="mt-1 text-sm">{cliente.nombre_contacto}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Correo</p>
            {cliente.correo_contacto ? (
              <a
                href={`mailto:${cliente.correo_contacto}`}
                className="mt-1 block text-sm text-primary underline underline-offset-4 hover:text-primary/80"
              >
                {cliente.correo_contacto}
              </a>
            ) : (
              <p className="mt-1 text-sm">—</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
            <p className="mt-1 text-sm">{cliente.telefono_contacto ?? '—'}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Cargo</p>
            <p className="mt-1 text-sm">{cliente.cargo_contacto ?? '—'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Datos del CRM */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del CRM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Empresa</p>
            {empresaNombre ? (
              <Link
                to={`/empresas/${cliente.empresa_id}`}
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
              {cliente.como_nos_conocio
                ? comoNosConocioLabels[cliente.como_nos_conocio]
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
          {cliente.notas ? (
            <p className="text-sm whitespace-pre-wrap">{cliente.notas}</p>
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
            <p className="mt-1 text-sm">{formatDate(cliente.creado_en)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Última actualización</p>
            <p className="mt-1 text-sm">{formatRelativeDate(cliente.actualizado_en)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
