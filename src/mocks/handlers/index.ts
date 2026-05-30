import { authHandlers } from './auth';
import { empresasHandlers } from './empresas';
import { usuariosHandlers } from './usuarios';
import { rolesHandlers } from './roles';
import { contactosHandlers } from './contactos';
import { tratosHandlers } from './tratos';
import { tareasHandlers } from './tareas';
import { tablerosHandlers } from './tableros';
import { etiquetasComentariosHandlers } from './etiquetas-comentarios';

export const handlers = [
  ...authHandlers,
  ...empresasHandlers,
  ...usuariosHandlers,
  ...rolesHandlers,
  ...contactosHandlers,
  ...tratosHandlers,
  ...tareasHandlers,
  ...tablerosHandlers,
  ...etiquetasComentariosHandlers,
];
