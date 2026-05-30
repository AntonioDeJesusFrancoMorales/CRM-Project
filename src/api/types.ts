// Tipos del contrato API. Esta es la fuente única de verdad.
// Cuando el contrato cambie, actualizar acá y propaga a TODA la app.

export type RolSistema = 'admin' | 'usuario';
export type EstadoRelacion = 'ACTIVO' | 'INACTIVO' | 'PROSPECTO';
export type TipoContrato = 'SERVICIO' | 'LICENCIA' | 'SUSCRIPCION' | 'PERMANENTE' | 'OTRO';
export type TipoTarea = 'GENERAL' | 'SEGUIMIENTO' | 'NEGOCIACION' | 'CIERRE';
export type PrioridadTarea = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
export type EstadoTareaLocal = 'pendiente' | 'en_progreso' | 'completada';
// TipoFicha eliminado — usar tipoFicha de src/features/kanban/schemas/ficha.schema.ts

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rolId: string;
  creadoEn: string;
  activo: boolean;                // READ-ONLY desde el back
  keycloakId: string | null;
}

export interface UsuarioSesion {  // Exclusivo para sesion de auth; independiente de Usuario
  id: string;
  nombre: string;
  correo: string;
  rol_sistema: RolSistema;
  rol_empresa: string | null;
}

export interface Rol {            // == RolResponse del back
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface Empresa {
  id: string;
  nombre: string;
  sector: string | null;
  telefono: string | null;
  paginaWeb: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  estadoRelacion: EstadoRelacion;
  responsableId: string | null;
  creadoPor: string | null;
  notas: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Contacto {
  id: string;
  nombre: string;
  correo: string | null;
  telefono: string | null;
  empresaId: string;
  estadoRelacion: EstadoRelacion;
  comoNosConocio: string | null;
  responsableId: string | null;
  creadoPor: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

// empresaId y creadoPor son inmutables en el back — no van en los payloads de mutación.
export interface ContactoCreatePayload {
  nombre: string;
  correo?: string | null;
  telefono?: string | null;
  empresaId: string;
  estadoRelacion: EstadoRelacion;
  comoNosConocio?: string | null;
  responsableId?: string | null;
}

export interface ContactoUpdatePayload {
  nombre?: string;
  correo?: string | null;
  telefono?: string | null;
  estadoRelacion?: EstadoRelacion;
  comoNosConocio?: string | null;
  responsableId?: string | null;
}

export interface Trato {
  id: string;
  contactoId: string;
  responsableId: string;
  nombre: string;
  valorEstimado: number | null;
  probabilidad: number | null;
  fechaCierreEsperada: string | null;
  tipoContrato: TipoContrato;
  motivoPerdida: string | null;
  creadoEn: string;
  actualizadoEn: string | null;
}

export interface TratoCreatePayload {
  contactoId: string;
  responsableId: string;
  nombre: string;
  valorEstimado: number | null;
  probabilidad: number | null;
  fechaCierreEsperada: string | null;
  tipoContrato: TipoContrato;
}

export type TratoUpdatePayload = Omit<TratoCreatePayload, 'contactoId'>;

export interface Tarea {
  id: string;
  tratoId: string;
  responsableId: string;
  titulo: string;
  descripcion: string | null;
  tipo: TipoTarea;
  prioridad: PrioridadTarea;
  fechaLimite: string;
  fechaCompletada: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

// Tablero, Columna, Ficha eliminados — usar schemas de src/features/kanban/schemas/

export interface Etiqueta {
  id: string;
  tablero_id: string;
  nombre: string;
  color: string;
}

export interface Comentario {
  id: string;
  ficha_id: string;
  usuario_id: string;
  contenido: string;
  creado_en: string;
}

// Respuesta de POST /auth/login
export interface LoginResponse {
  token: string;
  usuario: UsuarioSesion;
}

// Forma del error normalizado del contrato.
export interface ApiError {
  status: number;
  error: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}
