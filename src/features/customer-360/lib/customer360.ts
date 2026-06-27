import type { Contacto, Empresa, Tarea, Trato } from '@/api/types';

export interface Customer360Kpis {
  contactos: number | null;
  tratos: number;
  tratosAbiertos: number;
  pipelineAbierto: number;
  tareasPendientes: number;
}

export function getTratosByContacto(contactoId: string, tratos: Trato[]): Trato[] {
  return tratos.filter((trato) => trato.contactoId === contactoId);
}

export function getTareasByTratos(tratos: Trato[], tareas: Tarea[]): Tarea[] {
  const tratoIds = new Set(tratos.map((trato) => trato.id));
  return tareas.filter((tarea) => tratoIds.has(tarea.tratoId));
}

export function getContactosByEmpresa(empresaId: string, contactos: Contacto[]): Contacto[] {
  return contactos.filter((contacto) => contacto.empresaId === empresaId);
}

export function getTratosByEmpresa(contactosEmpresa: Contacto[], tratos: Trato[]): Trato[] {
  const contactoIds = new Set(contactosEmpresa.map((contacto) => contacto.id));
  return tratos.filter((trato) => contactoIds.has(trato.contactoId));
}

export function getEmpresaByContacto(contacto: Contacto, empresas: Empresa[]): Empresa | null {
  return empresas.find((empresa) => empresa.id === contacto.empresaId) ?? null;
}

export function getCustomer360Kpis(
  tratos: Trato[],
  tareas: Tarea[],
  contactos?: Contacto[],
): Customer360Kpis {
  const tratosAbiertos = tratos.filter((trato) => trato.estado === 'ABIERTO');

  return {
    contactos: contactos ? contactos.length : null,
    tratos: tratos.length,
    tratosAbiertos: tratosAbiertos.length,
    pipelineAbierto: tratosAbiertos.reduce((acc, trato) => acc + (trato.valorEstimado ?? 0), 0),
    tareasPendientes: tareas.filter((tarea) => tarea.fechaCompletada === null).length,
  };
}
