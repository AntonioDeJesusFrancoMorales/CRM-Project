// Tipos del contrato API. Esta es la fuente única de verdad.
// Cuando el contrato cambie, actualizar acá y propaga a TODA la app.

export type RolSistema = 'admin' | 'usuario';
export type EstadoRelacion = 'ACTIVO' | 'INACTIVO' | 'PROSPECTO';
export type TipoContrato = 'SERVICIO' | 'LICENCIA' | 'SUSCRIPCION' | 'PERMANENTE' | 'OTRO';
export type TipoTarea = 'GENERAL' | 'SEGUIMIENTO' | 'NEGOCIACION' | 'CIERRE';
export type PrioridadTarea = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
export type EstadoTareaLocal = 'pendiente' | 'en_progreso' | 'completada';
export type TipoFicha = 'trato' | 'tarea';

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol_sistema: RolSistema;
  rol_empresa: string | null;
  activo: boolean;
  creado_en: string;
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

export interface Tablero {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo_ficha: TipoFicha;
  creado_en: string;
}

export interface Columna {
  id: string;
  tablero_id: string;
  nombre: string;
  color: string;
  posicion: number;
  limite_wip: number | null;
  estado_vinculado: string | null;
}

export interface Ficha {
  id: string;
  columna_id: string;
  responsable_id: string;
  creado_por: string;
}

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
  usuario: Pick<Usuario, 'id' | 'nombre' | 'correo' | 'rol_sistema' | 'rol_empresa'>;
}

// Forma del error normalizado del contrato.
export interface ApiError {
  status: number;
  error: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}
