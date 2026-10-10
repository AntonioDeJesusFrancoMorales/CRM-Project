import { ExternalLink, Facebook, Globe, Instagram, Twitter, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Empresa } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/format';
import {
  displayWebsiteUrl,
  normalizeSocialUrl,
  normalizeWebsiteUrl,
  type EmpresaSocialNetwork,
} from '../lib/empresaLinks';
import { estadoRelacionBadgeClass, estadoRelacionLabels } from '../lib/estadoRelacion';
import { SensitiveField } from '@/features/permissions/components/PermissionState';

interface EmpresaInfoTabProps {
  empresa: Empresa;
}

export function EmpresaInfoTab({ empresa }: EmpresaInfoTabProps) {
  const websiteHref = empresa.paginaWeb ? normalizeWebsiteUrl(empresa.paginaWeb) : null;

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
              <SensitiveField resource="EMPRESA" group="CONTACTO_PRIVADO">
                {empresa.telefono ? (
                  <a href={`tel:${empresa.telefono}`} className="hover:text-primary hover:underline">
                    {empresa.telefono}
                  </a>
                ) : (
                  '—'
                )}
              </SensitiveField>
            }
          />
          <InfoField
            label="Página web"
            value={
              <SensitiveField resource="EMPRESA" group="CONTACTO_PRIVADO">
                {empresa.paginaWeb && websiteHref ? (
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={empresa.paginaWeb ?? undefined}
                    className="inline-flex max-w-full items-center gap-1 text-primary hover:underline"
                  >
                    <span className="block truncate">{displayWebsiteUrl(empresa.paginaWeb)}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </a>
                ) : empresa.paginaWeb ? (
                  <span title={empresa.paginaWeb}>{empresa.paginaWeb}</span>
                ) : (
                  '—'
                )}
              </SensitiveField>
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
          <SocialField
            icon={Facebook}
            label="Facebook"
            value={empresa.facebook}
            network="facebook"
          />
          <SocialField
            icon={Instagram}
            label="Instagram"
            value={empresa.instagram}
            network="instagram"
          />
          <SocialField
            icon={Twitter}
            label="Twitter / X"
            value={empresa.twitter}
            network="twitter"
          />
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-none sm:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <SensitiveField resource="EMPRESA" group="CONTACTO_PRIVADO">
            {empresa.notas ? (
              <p className="whitespace-pre-wrap text-sm leading-6">{empresa.notas}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Sin notas registradas.</p>
            )}
          </SensitiveField>
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
  network,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
  network: EmpresaSocialNetwork;
}) {
  const externalUrl = value ? normalizeSocialUrl(value, network) : null;

  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <SensitiveField resource="EMPRESA" group="CONTACTO_PRIVADO">
          {value && externalUrl ? (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={value}
              className="mt-1 inline-flex max-w-full items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              <span className="block truncate">{value}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </a>
          ) : (
            <p className="mt-1 truncate text-sm font-medium">{value ?? '—'}</p>
          )}
        </SensitiveField>
      </div>
    </div>
  );
}
