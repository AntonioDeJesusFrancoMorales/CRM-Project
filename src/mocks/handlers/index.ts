import { authHandlers } from './auth';
import { empresasHandlers } from './empresas';
import { usuariosHandlers } from './usuarios';
import { prospectosHandlers } from './prospectos';
import { clientesHandlers } from './clientes';
import { tratosHandlers } from './tratos';
import { tareasHandlers } from './tareas';
import { tablerosHandlers } from './tableros';
import { etiquetasComentariosHandlers } from './etiquetas-comentarios';

export const handlers = [
  ...authHandlers,
  ...empresasHandlers,
  ...usuariosHandlers,
  ...prospectosHandlers,
  ...clientesHandlers,
  ...tratosHandlers,
  ...tareasHandlers,
  ...tablerosHandlers,
  ...etiquetasComentariosHandlers,
];
