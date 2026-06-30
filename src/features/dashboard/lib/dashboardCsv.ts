import type { Contacto, Trato, Usuario } from '@/api/types';

export function createTratosCsv(tratos: Trato[], contactos: Contacto[], usuarios: Usuario[]): string {
  const contactosById = new Map(contactos.map((contacto) => [contacto.id, contacto]));
  const usuariosById = new Map(usuarios.map((usuario) => [usuario.id, usuario]));
  const rows = tratos.map((trato) =>
    [
      trato.nombre,
      contactosById.get(trato.contactoId)?.nombre ?? '',
      usuariosById.get(trato.responsableId)?.nombre ?? '',
      trato.valorEstimado ?? 0,
      trato.probabilidad ?? 0,
      trato.tipoContrato,
      trato.creadoEn,
    ]
      .map(escapeCsv)
      .join(','),
  );

  return ['Nombre,Contacto,Responsable,Valor,Probabilidad,Tipo,Creado', ...rows].join('\n');
}

export function downloadTratosCsv(tratos: Trato[], contactos: Contacto[], usuarios: Usuario[]): void {
  const csv = createTratosCsv(tratos, contactos, usuarios);
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tratos-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}
