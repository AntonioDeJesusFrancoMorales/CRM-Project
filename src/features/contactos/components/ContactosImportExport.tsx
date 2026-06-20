// Importar / Exportar contactos en CSV (client-side, sin endpoint nuevo).
// Exportar: descarga la lista actual. Importar: parsea CSV, salta teléfonos ya existentes,
// y crea los nuevos con POST /contactos/create (en lote, un solo toast de resumen).

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Download, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Contacto, ContactoCreatePayload } from '@/api/types';
import { contactosKeys } from '../hooks/useContactos';
import { useEmpresas } from '@/features/empresas/hooks/useEmpresas';

function exportarCsv(contactos: Contacto[]) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const filas = contactos.map((c) =>
    [c.nombre, c.telefono, c.correo, c.cargo, c.estadoRelacion].map(esc).join(','));
  const csv = ['Nombre,Telefono,Correo,Cargo,Estado', ...filas].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `contactos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface FilaCsv { nombre: string; telefono: string; correo: string }

// Parser simple: detecta delimitador (, o ;), reconoce cabeceras nombre/telefono/correo.
function parseCsv(texto: string): FilaCsv[] {
  const lineas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lineas.length === 0) return [];
  const delim = (lineas[0]!.match(/;/g)?.length ?? 0) > (lineas[0]!.match(/,/g)?.length ?? 0) ? ';' : ',';
  const split = (l: string) => l.split(delim).map((c) => c.trim().replace(/^"|"$/g, ''));
  const header = split(lineas[0]!).map((h) => h.toLowerCase());
  const idxNombre = header.findIndex((h) => h.includes('nombre'));
  const idxTel = header.findIndex((h) => h.includes('tel') || h.includes('whatsapp') || h.includes('celular'));
  const idxCorreo = header.findIndex((h) => h.includes('correo') || h.includes('email') || h.includes('mail'));
  // Si la primera fila no parece cabecera, la tratamos como dato (col 0 nombre, 1 tel, 2 correo).
  const hayHeader = idxNombre >= 0 || idxTel >= 0 || idxCorreo >= 0;
  const filas = (hayHeader ? lineas.slice(1) : lineas).map(split);
  const ni = hayHeader && idxNombre >= 0 ? idxNombre : 0;
  const ti = hayHeader && idxTel >= 0 ? idxTel : 1;
  const ci = hayHeader && idxCorreo >= 0 ? idxCorreo : 2;
  return filas
    .map((cols) => ({ nombre: cols[ni] ?? '', telefono: cols[ti] ?? '', correo: cols[ci] ?? '' }))
    .filter((f) => f.nombre || f.telefono);
}

export function ContactosImportExport({ contactos }: { contactos: Contacto[] }) {
  const queryClient = useQueryClient();
  const { data: empresas = [] } = useEmpresas();
  const [importOpen, setImportOpen] = useState(false);
  const [empresaId, setEmpresaId] = useState('');
  const [csv, setCsv] = useState('');
  const [importando, setImportando] = useState(false);

  const filas = parseCsv(csv);
  const telefonosExistentes = new Set(contactos.map((c) => (c.telefono ?? '').replace(/\D/g, '')).filter(Boolean));
  const nuevas = filas.filter((f) => {
    const tel = f.telefono.replace(/\D/g, '');
    return !tel || !telefonosExistentes.has(tel);
  });
  const duplicadas = filas.length - nuevas.length;

  async function handleImportar() {
    if (!empresaId || nuevas.length === 0) return;
    setImportando(true);
    let ok = 0;
    let fail = 0;
    for (const f of nuevas) {
      const payload: ContactoCreatePayload = {
        nombre: f.nombre || f.telefono,
        telefono: f.telefono || null,
        correo: f.correo || null,
        empresaId,
        estadoRelacion: 'PROSPECTO',
      };
      try {
        await apiClient.post<Contacto>(endpoints.contactos.create(), payload);
        ok++;
      } catch {
        fail++;
      }
    }
    void queryClient.invalidateQueries({ queryKey: contactosKeys.list() });
    setImportando(false);
    setImportOpen(false);
    setCsv('');
    toast.success(`Importación: ${ok} creados${fail ? `, ${fail} con error` : ''}${duplicadas ? `, ${duplicadas} duplicados omitidos` : ''}`);
  }

  return (
    <>
      <Button variant="outline" onClick={() => exportarCsv(contactos)} disabled={contactos.length === 0}>
        <Download className="mr-2 h-4 w-4" aria-hidden="true" />
        Exportar CSV
      </Button>
      <Button variant="outline" onClick={() => setImportOpen(true)}>
        <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
        Importar CSV
      </Button>

      <Dialog open={importOpen} onOpenChange={(o) => { setImportOpen(o); if (!o) setCsv(''); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar contactos</DialogTitle>
            <DialogDescription>
              Pega un CSV con columnas Nombre, Teléfono, Correo. Se omiten los teléfonos que ya existen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger><SelectValue placeholder="Empresa destino..." /></SelectTrigger>
              <SelectContent>
                {empresas.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder={'Nombre,Telefono,Correo\nJuan Pérez,5215512345678,juan@mail.com'}
              rows={8}
              className="font-mono text-xs"
            />

            {filas.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {nuevas.length} a importar · {duplicadas} duplicados omitidos
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancelar</Button>
            <Button
              disabled={!empresaId || nuevas.length === 0 || importando}
              onClick={handleImportar}
            >
              {importando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Importar {nuevas.length > 0 ? `(${nuevas.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
