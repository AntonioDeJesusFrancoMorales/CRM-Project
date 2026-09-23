import { ExternalLink, Facebook, Globe, Instagram, Twitter, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Empresa } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/format';
import { estadoRelacionBadgeClass, estadoRelacionLabels } from '../lib/estadoRelacion';

interface EmpresaInfoTabProps {
  empresa: Empresa;
}

export function EmpresaInfoTab({ empresa }: EmpresaInfoTabProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="rounded-lg shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Globe className="h-4 w-4 text-primary" aria-hidden="true" />
            Información general
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <InfoField label="Sector" value={empresa.sector} />
          <InfoField
            label="Teléfono"
            value={
              empresa.telefono ? (
                <a href={`tel:${empresa.telefono}`} className="hover:text-primary hover:underline">
                  {empresa.telefono}
                </a>
              ) : null
            }
          />
          <InfoField
            label="Sitio web"
            value={
              empresa.paginaWeb ? (
                <a
                  href={empresa.paginaWeb}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1 text-primary hover:underline"
                >
                  <span className="truncate">
                    {empresa.paginaWeb.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </a>
              ) : null
            }
          />
          <InfoField
            label="Estado"
            value={
              <Badge
                variant="outline"
                className={`rounded-full ${estadoRelacionBadgeClass[empresa.estadoRelacion]}`}
              >
                {estadoRelacionLabels[empresa.estadoRelacion]}
              </Badge>
            }
          />
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Instagram className="h-4 w-4 text-primary" aria-hidden="true" />
            Redes sociales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SocialField icon={Facebook} label="Facebook" value={empresa.facebook} />
          <SocialField icon={Instagram} label="Instagram" value={empresa.instagram} />
          <SocialField icon={Twitter} label="Twitter / X" value={empresa.twitter} />
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-none sm:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Notas</CardTitle>
        </CardHeader>
        <CardContent>
          {empresa.notas ? (
            <p className="whitespace-pre-wrap text-sm leading-6">{empresa.notas}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Sin notas registradas.</p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-none sm:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Registro</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <InfoField label="Fecha de registro" value={formatDate(empresa.creadoEn)} />
          <InfoField label="Última actualización" value={formatDate(empresa.actualizadoEn)} />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="truncate text-sm font-medium">{value ?? '—'}</div>
    </div>
  );
}

function SocialField({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
}) {
  const isExternalUrl = value?.startsWith('http://') || value?.startsWith('https://');

  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {value && isExternalUrl ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex max-w-full items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <span className="truncate">{value}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </a>
        ) : (
          <p className="mt-1 truncate text-sm font-medium">{value ?? '—'}</p>
        )}
      </div>
    </div>
  );
}
