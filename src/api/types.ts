// Tipos del contrato API. Esta es la fuente única de verdad.
// Cuando el contrato cambie, actualizar acá y propaga a TODA la app.

export type RolSistema = 'admin' | 'usuario';
export type ComoNosConocio = 'referido' | 'redes_sociales' | 'busqueda' | 'evento' | 'otro';
export type EstadoPosibleCliente = 'frio' | 'tibio' | 'caliente';
export type TipoContrato = 'precio_fijo' | 'tiempo_materiales' | 'retainer';
export type EstadoTrato = 'abierto' | 'ganado' | 'perdido';
export type TipoTarea = 'llamada' | 'reunion' | 'email' | 'demo' | 'seguimiento';
export type EstadoTarea = 'pendiente' | 'en_progreso' | 'completada';
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
  pagina_web: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface Prospecto {
  id: string;
  empresa_id: string;
  responsable_id: string;
  creado_por: string;
  nombre_contacto: string;
  correo_contacto: string | null;
  telefono_contacto: string | null;
  cargo_contacto: string | null;
  como_nos_conocio: ComoNosConocio | null;
  estado_posible_cliente: EstadoPosibleCliente;
  notas: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface Cliente {
  id: string;
  empresa_id: string;
  responsable_id: string;
  creado_por: string;
  nombre_contacto: string;
  correo_contacto: string | null;
  telefono_contacto: string | null;
  cargo_contacto: string | null;
  como_nos_conocio: ComoNosConocio | null;
  notas: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface Trato {
  id: string;
  prospecto_id: string | null;
  cliente_id: string | null;
  responsable_id: string;
  nombre: string;
  valor_estimado: number | null;
  probabilidad: number | null;
  fecha_cierre_esperada: string | null;
  tipo_contrato: TipoContrato | null;
  estado: EstadoTrato;
  motivo_perdida: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface Tarea {
  id: string;
  trato_id: string;
  responsable_id: string;
  titulo: string;
  descripcion: string | null;
  tipo: TipoTarea;
  estado: EstadoTarea;
  prioridad: 1 | 2 | 3;
  fecha_limite: string | null;
  fecha_completada: string | null;
  creado_en: string;
  actualizado_en: string;
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
