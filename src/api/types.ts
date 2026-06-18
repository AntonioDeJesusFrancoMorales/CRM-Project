// Tipos del contrato API. Esta es la fuente única de verdad.
// Cuando el contrato cambie, actualizar acá y propaga a TODA la app.

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

export interface UsuarioSesion {  // Exclusivo para sesion de auth; isomorfo al ActorContext del back
  subject: string;           // token.sub
  username: string;          // token.preferred_username
  email: string;             // token.email
  usuario_id: string;        // token.usuario_id (claim custom, UUID)
  super_usuario_id: string | null; // token.super_usuario_id (claim custom, null si usuario normal)
  roles: string[];           // token.realm_access.roles
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
  cargo: string | null;
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
  cargo?: string | null;
  comoNosConocio?: string | null;
  responsableId?: string | null;
}

// EditContactoRequest del back: nombre (@NotBlank) y estadoRelacion (@NotNull) son
// REQUERIDOS. El PUT /contactos/edit es REEMPLAZO TOTAL, no PATCH parcial — por eso
// el payload no puede dejarlos opcionales. Para cambiar SOLO el estado, usar el
// endpoint dedicado /contactos/cambiar-estado (useCambiarEstadoContacto).
export interface ContactoUpdatePayload {
  nombre: string;
  estadoRelacion: EstadoRelacion;
  correo?: string | null;
  telefono?: string | null;
  cargo?: string | null;
  comoNosConocio?: string | null;
  responsableId?: string | null;
}

// Body de PUT /contactos/cambiar-estado?id= (endpoint dedicado de contactos).
// La empresa cambia su estado vía el form de edición (PUT /empresas/edit), no por este endpoint.
export interface CambiarEstadoPayload {
  nuevoEstado: EstadoRelacion;
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

// TipoEtiqueta — catálogo de etiquetas tipadas del back (TipoEtiqueta.java).
// Una etiqueta TRATO solo aplica a fichas TRATO; TAREA solo a fichas TAREA.
export type TipoEtiqueta = 'TAREA' | 'TRATO';

// Etiqueta == EtiquetaResponse del back. Catálogo GLOBAL: el back es la fuente
// de verdad de nombre+color (editar actualiza universalmente en todas las fichas).
// color es hex '#RRGGBB' (normalizado a MAYÚS por el back).
export interface Etiqueta {
  id: string;
  nombre: string;
  tipoEtiqueta: TipoEtiqueta;
  color: string;
  creadoEn: string;
}

export interface Comentario {
  id: string;
  ficha_id: string;
  usuario_id: string;
  contenido: string;
  creado_en: string;
}

// Forma del error normalizado del contrato.
export interface ApiError {
  status: number;
  error: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

// ── WhatsApp module types ────────────────────────────────────────────────────

export type EstadoCanal = 'ACTIVO' | 'INACTIVO' | 'DESCONECTADO';
// EN_ESPERA = "pendiente": el back la pone así automáticamente tras un handoff a humano
// (label escalado_humano), igual al estado "pending" de Chatwoot/AmbarCRM.
export type EstadoConversacion = 'ABIERTA' | 'EN_ESPERA' | 'CERRADA';
export type TipoMensaje = 'TEXTO' | 'IMAGEN' | 'AUDIO' | 'VIDEO' | 'DOCUMENTO' | 'STICKER' | 'UBICACION';
export type DireccionMensaje = 'ENTRANTE' | 'SALIENTE';
export type StatusMensaje = 'ENVIADO' | 'ENTREGADO' | 'LEIDO' | 'FALLIDO';
export type ProveedorCanal = 'EVOLUTION_API';

export interface CanalWhatsapp {
  id: string;
  empresaId: string;
  nombre: string;
  instanceName: string;
  proveedor: ProveedorCanal;
  estado: EstadoCanal;
  apiUrl: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Conversacion {
  id: string;
  canalId: string;
  contactoId: string | null;
  numeroTelefono: string;
  nombreContacto: string | null;
  estado: EstadoConversacion;
  asignadoA: string | null;
  noLeidos: number;
  ultimoMensajeAt: string | null;
  ultimoMensajeTexto: string | null;
  // labels/botActivo: contrato Chatwoot/n8n. labels=["escalado_humano"] => botActivo=false.
  labels: string[];
  botActivo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

// Label que el bot (o un humano desde el panel) usa para handoff. Apaga el bot.
export const LABEL_ESCALADO_HUMANO = 'escalado_humano';

// Bot == BotResponse del back (BotController). Agent Bot estilo Chatwoot conectado a n8n:
// el CRM le manda los mensajes entrantes al webhookUrl y el bot responde con apiAccessToken.
// canalId null = aplica a todos los canales.
export interface Bot {
  id: string;
  nombre: string;
  canalId: string | null;
  webhookUrl: string;
  apiAccessToken: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Mensaje {
  id: string;
  conversacionId: string;
  waMessageId: string;
  tipo: TipoMensaje;
  direccion: DireccionMensaje;
  contenido: string | null;
  mediaUrl: string | null;
  status: StatusMensaje;
  enviadoPor: string | null;
  creadoEn: string;
}

export interface Grupo {
  id: string;
  canalId: string | null;
  jid: string;
  nombre: string;
  noLeidos: number;
  ultimoMensajeAt: string | null;
}

export interface MensajeGrupo {
  id: string;
  grupoId: string;
  direccion: DireccionMensaje;
  tipo: TipoMensaje;
  contenido: string | null;
  mediaUrl: string | null;
  remitente: string | null;
  remitenteTel: string | null;
  status: StatusMensaje;
  timestamp: string | null;
}

export interface CanalCreatePayload {
  empresaId: string;
  nombre: string;
  instanceName: string;
  proveedor: ProveedorCanal;
  apiUrl: string;
  apiKey: string;
}

export interface CanalUpdatePayload {
  nombre: string;
  instanceName: string;
  apiUrl: string;
  apiKey: string;
}

export interface SendMensajePayload {
  tipo: TipoMensaje;
  contenido?: string | null;
  mediaUrl?: string | null;
}
