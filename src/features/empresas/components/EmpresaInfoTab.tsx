import { Facebook, Globe, Instagram, Phone, Twitter } from 'lucide-react';
import type { Empresa } from '@/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatRelativeDate } from '@/lib/format';

interface EmpresaInfoTabProps {
  empresa: Empresa;
}

export function EmpresaInfoTab({ empresa }: EmpresaInfoTabProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Información general */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información general</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Sector</p>
            <p className="mt-1 text-sm">{empresa.sector ?? '—'}</p>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
              <p className="mt-0.5 text-sm">{empresa.telefono ?? '—'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sitio web</p>
              {empresa.paginaWeb ? (
                <a
                  href={empresa.paginaWeb}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 block text-sm text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  {empresa.paginaWeb}
                </a>
              ) : (
                <p className="mt-0.5 text-sm">—</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redes sociales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Redes sociales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Facebook className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Facebook</p>
              <p className="mt-0.5 text-sm">{empresa.facebook ?? '—'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Instagram className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Instagram</p>
              <p className="mt-0.5 text-sm">{empresa.instagram ?? '—'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Twitter className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Twitter / X</p>
              <p className="mt-0.5 text-sm">{empresa.twitter ?? '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notas */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Notas</CardTitle>
        </CardHeader>
        <CardContent>
          {empresa.notas ? (
            <p className="whitespace-pre-wrap text-sm">{empresa.notas}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Sin notas registradas.</p>
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
            <p className="mt-1 text-sm">{formatDate(empresa.creadoEn)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Última actualización</p>
            <p className="mt-1 text-sm">{formatRelativeDate(empresa.actualizadoEn)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
